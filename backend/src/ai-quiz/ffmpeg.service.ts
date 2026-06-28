
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const unlink = promisify(fs.unlink);

@Injectable()
export class FfmpegService {
  async getMediaDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        filePath
      ]);

      let stdout = '';
      let stderr = '';

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffprobe.on('close', (code) => {
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

      ffprobe.on('error', (error) => {
        reject(new InternalServerErrorException(`ffprobe execution error: ${error.message}`));
      });
    });
  }
  async extractAudioFromVideo(videoPath: string, outputDir: string): Promise<string> {
    const outputWavPath = path.join(outputDir, `${Date.now()}-extracted.wav`);

    return new Promise((resolve, reject) => {
      // Use FFmpeg to convert video to WAV (16kHz, mono, 16-bit PCM for best Whisper compatibility)
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

      // Manual 15-minute timeout for extracting audio from long videos
      const timeoutId = setTimeout(() => {
        if (!isFinished) {
          isFinished = true;
          ffmpeg.kill('SIGKILL');
          reject(new InternalServerErrorException('FFmpeg audio extraction timed out (15 minutes limit reached)'));
        }
      }, 900000);

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', async (code) => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timeoutId);

        if (code === 0) {
          resolve(outputWavPath);
        } else {
          // Clean up if failed
          try {
            if (fs.existsSync(outputWavPath)) {
              await unlink(outputWavPath);
            }
          } catch (cleanupError) {
            console.error('FFmpeg cleanup error:', cleanupError);
          }
          console.error('FFmpeg stderr:', stderr);
          reject(new InternalServerErrorException(`Failed to extract audio from video. Exit code: ${code}. FFmpeg might not be installed or the video file is corrupted.`));
        }
      });

      ffmpeg.on('error', (error: any) => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timeoutId);
        
        if (error.code === 'ENOENT') {
          reject(new InternalServerErrorException('FFmpeg is not installed or not found in system PATH. Please install FFmpeg to process video quizzes.'));
        } else {
          reject(new InternalServerErrorException(`FFmpeg execution error: ${error.message}`));
        }
      });
    });
  }
}
