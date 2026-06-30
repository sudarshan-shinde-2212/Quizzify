import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const unlink = promisify(fs.unlink);

@Injectable()
export class FfmpegService {
  // ── Existing: media duration ───────────────────────────────────────────────

  async getMediaDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        filePath,
      ]);

      let stdout = '';
      let stderr = '';

      ffprobe.stdout.on('data', d => { stdout += d.toString(); });
      ffprobe.stderr.on('data', d => { stderr += d.toString(); });

      ffprobe.on('close', code => {
        if (code === 0) {
          const duration = parseFloat(stdout.trim());
          if (!isNaN(duration)) {
            resolve(duration);
          } else {
            reject(new InternalServerErrorException('Failed to parse media duration'));
          }
        } else {
          console.error('ffprobe error:', stderr);
          reject(new InternalServerErrorException('Failed to get media duration. File might be corrupted.'));
        }
      });

      ffprobe.on('error', error => {
        reject(new InternalServerErrorException(`ffprobe execution error: ${error.message}`));
      });
    });
  }

  // ── Existing: extract audio ────────────────────────────────────────────────

  async extractAudioFromVideo(videoPath: string, outputDir: string): Promise<string> {
    const outputWavPath = path.join(outputDir, `${Date.now()}-extracted.wav`);

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vn',
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        '-y',
        outputWavPath,
      ]);

      let stderr = '';
      let isFinished = false;

      const timeoutId = setTimeout(() => {
        if (!isFinished) {
          isFinished = true;
          ffmpeg.kill('SIGKILL');
          reject(new InternalServerErrorException('FFmpeg audio extraction timed out (15 minutes limit reached)'));
        }
      }, 900_000);

      ffmpeg.stderr.on('data', d => { stderr += d.toString(); });

      ffmpeg.on('close', async code => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timeoutId);

        if (code === 0) {
          resolve(outputWavPath);
        } else {
          try {
            if (fs.existsSync(outputWavPath)) await unlink(outputWavPath);
          } catch {}
          console.error('FFmpeg stderr:', stderr);
          reject(new InternalServerErrorException(
            `Failed to extract audio from video. Exit code: ${code}. FFmpeg might not be installed or the video file is corrupted.`
          ));
        }
      });

      ffmpeg.on('error', (error: any) => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timeoutId);

        if (error.code === 'ENOENT') {
          reject(new InternalServerErrorException(
            'FFmpeg is not installed or not found in system PATH. Please install FFmpeg to process video quizzes.'
          ));
        } else {
          reject(new InternalServerErrorException(`FFmpeg execution error: ${error.message}`));
        }
      });
    });
  }

  // ── New: adaptive key-frame extraction ────────────────────────────────────

  /**
   * Extract key frames from a video using adaptive fps + mpdecimate filter.
   * Uses FRAME_SAMPLE_SECONDS environment variable or defaults to 2.0.
   */
  async extractKeyFrames(
    videoPath: string,
    outputDir: string,
    maxFrames = 80,
  ): Promise<string[]> {
    const sampleSeconds = parseFloat(process.env.FRAME_SAMPLE_SECONDS || '2.0');
    const fps = 1 / Math.max(0.1, sampleSeconds);

    const outputPattern = path.join(outputDir, 'vframe-%06d.jpg');

    await new Promise<void>((resolve, reject) => {
      // mpdecimate removes near-duplicate frames; setpts resets timestamps after
      const ff = spawn('ffmpeg', [
        '-i', videoPath,
        '-vf', `fps=${fps.toFixed(5)},mpdecimate,setpts=N/FRAME_RATE/TB`,
        '-vsync', 'vfr',
        '-frames:v', String(maxFrames),
        '-q:v', '5',
        '-s', '1024x576',
        '-y',
        outputPattern,
      ]);

      let stderr = '';
      let done = false;

      const timeout = setTimeout(() => {
        if (!done) { done = true; ff.kill('SIGKILL'); reject(new InternalServerErrorException('Frame extraction timed out')); }
      }, 300_000);

      ff.stderr.on('data', d => { stderr += d.toString(); });

      ff.on('close', code => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        if (code === 0 || code === 1) {
          resolve();
        } else {
          console.error('Frame extraction stderr:', stderr);
          reject(new InternalServerErrorException(`Frame extraction failed (exit ${code})`));
        }
      });

      ff.on('error', err => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        reject(new InternalServerErrorException(`FFmpeg error during frame extraction: ${err.message}`));
      });
    });

    return fs.readdirSync(outputDir)
      .filter(f => f.startsWith('vframe-') && f.endsWith('.jpg'))
      .sort()
      .map(f => path.join(outputDir, f));
  }

  // ── New: perceptual similarity deduplication ─────────────────────────────

  /**
   * Generates a 64-byte grayscale raw buffer of an image (8x8 grid) for fast fingerprint comparison
   */
  async getFrameFingerprint(framePath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', framePath,
        '-vf', 'scale=8:8,format=gray',
        '-f', 'rawvideo',
        '-',
      ]);

      const chunks: Buffer[] = [];
      
      ffmpeg.stdout.on('data', chunk => {
        chunks.push(chunk);
      });

      ffmpeg.on('close', code => {
        if (code === 0) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(`Failed to generate fingerprint for ${framePath}`));
        }
      });

      ffmpeg.on('error', err => {
        reject(err);
      });
    });
  }

  /**
   * Prunes extracted frames down by comparing similarity against the LAST accepted unique frame.
   * Configurable via FRAME_SIMILARITY_THRESHOLD and MAX_VISION_FRAMES environment variables.
   */
  async deduplicateFrames(framePaths: string[]): Promise<string[]> {
    const threshold = parseFloat(process.env.FRAME_SIMILARITY_THRESHOLD || '3.0');
    const maxVisionFrames = parseInt(process.env.MAX_VISION_FRAMES || '20', 10);

    if (framePaths.length === 0) return [];

    const acceptedPaths: string[] = [];
    let lastAcceptedFingerprint: Buffer | null = null;

    for (const framePath of framePaths) {
      if (acceptedPaths.length >= maxVisionFrames) {
        break;
      }

      try {
        const fingerprint = await this.getFrameFingerprint(framePath);
        if (fingerprint.length !== 64) {
          acceptedPaths.push(framePath);
          lastAcceptedFingerprint = fingerprint;
          continue;
        }

        if (!lastAcceptedFingerprint) {
          acceptedPaths.push(framePath);
          lastAcceptedFingerprint = fingerprint;
          continue;
        }

        // Calculate Mean Absolute Error (MAE) against the last accepted unique frame
        let absoluteErrorSum = 0;
        for (let i = 0; i < 64; i++) {
          absoluteErrorSum += Math.abs(fingerprint[i] - lastAcceptedFingerprint[i]);
        }
        const mae = absoluteErrorSum / 64;

        if (mae >= threshold) {
          acceptedPaths.push(framePath);
          lastAcceptedFingerprint = fingerprint;
        }
      } catch (err) {
        // Fallback: accept frame if fingerprint generation fails
        acceptedPaths.push(framePath);
      }
    }

    return acceptedPaths;
  }

  // ── New: PDF → JPEG pages via Ghostscript ─────────────────────────────────

  async convertPdfToImages(
    pdfPath: string,
    outputDir: string,
    maxPages = 15,
  ): Promise<string[]> {
    const outputPattern = path.join(outputDir, 'pdfpage-%04d.jpg');

    const success = await new Promise<boolean>(resolve => {
      let done = false;

      const gs = spawn('gs', [
        '-dBATCH', '-dNOPAUSE', '-dQUIET',
        '-sDEVICE=jpeg',
        '-r150',
        '-dJPEGQ=90',
        `-dLastPage=${maxPages}`,
        `-sOutputFile=${outputPattern}`,
        pdfPath,
      ]);

      const timeout = setTimeout(() => {
        if (!done) { done = true; gs.kill('SIGKILL'); resolve(false); }
      }, 120_000);

      gs.on('close', code => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        resolve(code === 0);
      });

      gs.on('error', () => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        resolve(false);
      });
    });

    if (!success) return [];

    return fs.readdirSync(outputDir)
      .filter(f => f.startsWith('pdfpage-') && f.endsWith('.jpg'))
      .sort()
      .map(f => path.join(outputDir, f));
  }
}
