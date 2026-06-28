
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const unlink = promisify(fs.unlink);

@Injectable()
export class FfmpegService {
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
