
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { promisify } from 'util';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

const unlink = promisify(fs.unlink);

@Injectable()
export class WhisperService {
  private whisperExecutable: string;
  private whisperModel: string;

  constructor(private configService: ConfigService) {
    this.whisperExecutable = this.configService.get<string>('WHISPER_EXECUTABLE') || 'C:\\whisper.cpp\\build\\bin\\Release\\whisper-cli.exe';
    this.whisperModel = this.configService.get<string>('WHISPER_MODEL') || 'C:\\whisper.cpp\\models\\ggml-medium.bin';
  }

  async transcribeAudio(audioPath: string, outputDir: string): Promise<string> {
    const outputBaseName = path.join(outputDir, `${Date.now()}-transcript`);

    return new Promise((resolve, reject) => {
      // Verify model and executable exist before running
      if (!fs.existsSync(this.whisperExecutable)) {
        return reject(new InternalServerErrorException(`Whisper executable not found at: ${this.whisperExecutable}`));
      }
      if (!fs.existsSync(this.whisperModel)) {
        return reject(new InternalServerErrorException(`Whisper model not found at: ${this.whisperModel}`));
      }

      const args = [
        '-m', this.whisperModel,
        '-f', audioPath,
        '-oj', // Output JSON
        '-of', outputBaseName,
        '-nt', // No timestamps
      ];

      const whisper = spawn(this.whisperExecutable, args);
      
      let stdout = '';
      let stderr = '';
      let isFinished = false;

      // Manual 5-minute timeout (spawn timeout option only works in spawnSync)
      const timeoutId = setTimeout(() => {
        if (!isFinished) {
          isFinished = true;
          whisper.kill('SIGKILL');
          reject(new InternalServerErrorException('Whisper transcription timed out (5 minutes limit reached)'));
        }
      }, 300000);

      whisper.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      whisper.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      whisper.on('close', async (code) => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timeoutId);

        const jsonOutputPath = `${outputBaseName}.json`;

        try {
          if (code === 0 && fs.existsSync(jsonOutputPath)) {
            const jsonContent = fs.readFileSync(jsonOutputPath, 'utf8');
            const parsed = JSON.parse(jsonContent);
            
            // Robust parsing of whisper JSON structure
            let transcript = '';
            if (parsed.transcription && Array.isArray(parsed.transcription)) {
              transcript = parsed.transcription.map((t: any) => t.text || '').join(' ').trim();
            } else if (typeof parsed.transcription === 'string') {
              transcript = parsed.transcription.trim();
            } else if (parsed.text) {
              transcript = parsed.text.trim();
            }

            // Cleanup temp files
            try {
              await unlink(jsonOutputPath);
            } catch (cleanupErr) {
              console.error('Whisper JSON cleanup error:', cleanupErr);
            }

            resolve(transcript);
          } else {
            console.error('Whisper stderr:', stderr);
            console.error('Whisper stdout:', stdout);
            const errorDetails = stderr.trim() ? `. Stderr: ${stderr.trim().substring(0, 300)}` : '';
            reject(new InternalServerErrorException(`Failed to transcribe audio. Exit code: ${code}${errorDetails}`));
          }
        } catch (err) {
          console.error('Error parsing Whisper output:', err);
          reject(new InternalServerErrorException('Failed to parse Whisper output JSON'));
        }
      });

      whisper.on('error', (error) => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timeoutId);
        reject(new InternalServerErrorException(`Whisper execution error: ${error.message}`));
      });
    });
  }
}
