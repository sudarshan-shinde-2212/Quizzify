import { Injectable, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { FfmpegService } from './ffmpeg.service';
import { WhisperService } from './whisper.service';
import { ParserService } from './parser.service';
import { VisionOcrService } from './vision-ocr.service';
import { KnowledgeFusionService, TopicAllocation } from './knowledge-fusion.service';
import { AiContentGeneratorService } from './ai-content-generator.service';

export type FileType = 'video' | 'audio' | 'document' | 'image';

export interface GenerateQuizFromFileParams {
  filePath: string;
  fileType: FileType;
  difficulty: string;
  questionCount: number;
  language?: string;
  onProgress?: (stage: string, progress: number) => void;
}

@Injectable()
export class QuizFileProcessorService {
  private readonly logger = new Logger(QuizFileProcessorService.name);

  constructor(
    private readonly ffmpegService: FfmpegService,
    private readonly whisperService: WhisperService,
    private readonly parserService: ParserService,
    private readonly visionOcrService: VisionOcrService,
    private readonly fusionService: KnowledgeFusionService,
    private readonly aiContentGeneratorService: AiContentGeneratorService,
  ) {}

  async generateQuizFromFile(params: GenerateQuizFromFileParams) {
    const { filePath, fileType, difficulty, questionCount, language, onProgress } = params;
    const startTime = Date.now();
    
    // Create a unique temporary directory for this run to keep cleanups isolated and absolute
    const runId = `run-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const runDir = path.join('./temp', runId);
    fs.mkdirSync(runDir, { recursive: true });

    // Move the uploaded file into our isolated directory
    const originalFilename = path.basename(filePath);
    const localFilePath = path.join(runDir, originalFilename);
    try {
      fs.renameSync(filePath, localFilePath);
    } catch (renameError) {
      // Fallback if renaming across drive partitions fails
      fs.copyFileSync(filePath, localFilePath);
      try { fs.unlinkSync(filePath); } catch {}
    }

    let finalKnowledgeText = '';
    let domains: string[] = ['General Knowledge'];
    let topics: TopicAllocation[] = [];
    let ocrConfidence = 100;
    let visualConfidence = 100;

    let totalFramesExtracted = 0;
    let totalFramesAnalyzed = 0;

    const reportProgress = (stage: string, percent: number) => {
      if (onProgress) {
        onProgress(stage, percent);
      }
      this.logger.log(`[Processing Progress] ${percent}% - ${stage}`);
    };

    try {
      reportProgress('Detecting content type...', 5);

      if (fileType === 'document') {
        reportProgress('Extracting text...', 15);
        let extractedText = '';
        try {
          extractedText = await this.parserService.parseDocument(localFilePath);
        } catch (parseErr: any) {
          this.logger.warn(`Digital document parsing failed: ${parseErr.message || parseErr}. Falling back to OCR.`);
        }

        // If the document has no selectable text, treat it as a scanned PDF
        const isScanned = !extractedText || extractedText.trim().length < 100;
        if (isScanned && localFilePath.toLowerCase().endsWith('.pdf')) {
          reportProgress('Detecting scanned pages...', 25);
          reportProgress('Extracting PDF pages...', 35);
          
          const pageImages = await this.ffmpegService.convertPdfToImages(localFilePath, runDir);
          if (pageImages.length === 0) {
            throw new BadRequestException(
              'This PDF has no selectable text and could not be converted to images. Please check if Ghostscript (gs) is installed on the server.'
            );
          }

          reportProgress('Running OCR & Reading handwritten text...', 55);
          const visionResults = await this.visionOcrService.analyzeImagesBatch(
            pageImages,
            'Scanned PDF page',
            2,
            (done, total) => {
              reportProgress(`Reading scanned page ${done} of ${total}...`, 55 + Math.floor((done / total) * 20));
            }
          );

          reportProgress('Organizing knowledge...', 80);
          const fusionDoc = await this.fusionService.buildKnowledgeDocument({
            sourceFileType: 'Scanned PDF',
            questionCount,
            visionResults: visionResults.map((r, idx) => ({
              ocrText: r.ocrText,
              visualDescription: r.visualDescription,
              sourceLabel: `Page ${idx + 1}`,
              hasHandwriting: r.hasHandwriting,
              ocrConfidence: r.ocrConfidence,
              visualConfidence: r.visualConfidence,
              handwritingConfidence: r.handwritingConfidence,
              diagramConfidence: r.diagramConfidence,
              tableConfidence: r.tableConfidence,
              language: r.language,
            })),
          });

          finalKnowledgeText = fusionDoc.organizedContent;
          domains = fusionDoc.domains;
          topics = fusionDoc.topics;
          ocrConfidence = fusionDoc.ocrConfidence;
          visualConfidence = fusionDoc.visualConfidence;

        } else {
          if (!extractedText || extractedText.trim().length === 0) {
            throw new BadRequestException('This document contains no readable text.');
          }
          reportProgress('Organizing knowledge...', 80);
          const fusionDoc = await this.fusionService.buildKnowledgeDocument({
            sourceFileType: 'Digital Document',
            documentText: extractedText,
            questionCount,
          });

          finalKnowledgeText = fusionDoc.organizedContent;
          domains = fusionDoc.domains;
          topics = fusionDoc.topics;
          ocrConfidence = fusionDoc.ocrConfidence;
          visualConfidence = fusionDoc.visualConfidence;
        }

      } else if (fileType === 'image') {
        reportProgress('Analyzing image & Running OCR...', 30);
        const result = await this.visionOcrService.analyzeImage(localFilePath, 'Uploaded Image');
        
        if (!result.ocrText && !result.visualDescription) {
          throw new BadRequestException('Unreadable image content.');
        }

        reportProgress('Organizing knowledge...', 75);
        const fusionDoc = await this.fusionService.buildKnowledgeDocument({
          sourceFileType: 'Image',
          questionCount,
          visionResults: [{
            ocrText: result.ocrText,
            visualDescription: result.visualDescription,
            sourceLabel: 'Uploaded Image',
            hasHandwriting: result.hasHandwriting,
            ocrConfidence: result.ocrConfidence,
            visualConfidence: result.visualConfidence,
            handwritingConfidence: result.handwritingConfidence,
            diagramConfidence: result.diagramConfidence,
            tableConfidence: result.tableConfidence,
            language: result.language,
          }],
        });

        finalKnowledgeText = fusionDoc.organizedContent;
        domains = fusionDoc.domains;
        topics = fusionDoc.topics;
        ocrConfidence = fusionDoc.ocrConfidence;
        visualConfidence = fusionDoc.visualConfidence;

      } else if (fileType === 'audio') {
        reportProgress('Transcribing audio...', 40);
        const transcript = await this.whisperService.transcribeAudio(localFilePath, runDir);
        if (!transcript || transcript.trim().length === 0) {
          throw new BadRequestException('Audio transcription returned no text.');
        }
        
        reportProgress('Organizing knowledge...', 80);
        const fusionDoc = await this.fusionService.buildKnowledgeDocument({
          sourceFileType: 'Audio',
          audioTranscript: transcript,
          questionCount,
        });

        finalKnowledgeText = fusionDoc.organizedContent;
        domains = fusionDoc.domains;
        topics = fusionDoc.topics;
        ocrConfidence = fusionDoc.ocrConfidence;
        visualConfidence = fusionDoc.visualConfidence;

      } else if (fileType === 'video') {
        const duration = await this.ffmpegService.getMediaDuration(localFilePath);
        if (duration > 300) {
          throw new BadRequestException('Video files must not exceed 5 minutes.');
        }

        reportProgress('Extracting audio & Transcribing speech...', 20);
        const wavPath = await this.ffmpegService.extractAudioFromVideo(localFilePath, runDir);
        const audioTranscriptPromise = this.whisperService.transcribeAudio(wavPath, runDir)
          .catch(err => {
            this.logger.warn(`Whisper transcription failed: ${err.message}. Continuing with video visuals.`);
            return '';
          });

        reportProgress('Extracting key frames & Detecting scene changes...', 40);
        const allFrameImages = await this.ffmpegService.extractKeyFrames(localFilePath, runDir, 80);
        totalFramesExtracted = allFrameImages.length;

        let visionResults: any[] = [];
        if (allFrameImages.length > 0) {
          reportProgress('Running smart frame deduplication...', 50);
          const uniqueFrameImages = await this.ffmpegService.deduplicateFrames(allFrameImages);
          totalFramesAnalyzed = uniqueFrameImages.length;

          this.logger.log(`[Video Deduplication] Total Frames: ${allFrameImages.length}, Unique frames: ${uniqueFrameImages.length}, Removed: ${allFrameImages.length - uniqueFrameImages.length}`);

          reportProgress('Analyzing visuals & Reading text...', 65);
          visionResults = await this.visionOcrService.analyzeImagesBatch(
            uniqueFrameImages,
            'Video Frame',
            3,
            (done, total) => {
              reportProgress(`Analyzing video frame ${done} of ${total}...`, 65 + Math.floor((done / total) * 15));
            }
          );
        }

        const audioTranscript = await audioTranscriptPromise;

        if (!audioTranscript && visionResults.length === 0) {
          throw new BadRequestException('Could not extract any audio transcript or visual content from this video.');
        }

        reportProgress('Combining audio and visuals...', 85);
        const fusionDoc = await this.fusionService.buildKnowledgeDocument({
          sourceFileType: 'Video',
          audioTranscript,
          questionCount,
          visionResults: visionResults.map((r, idx) => ({
            ocrText: r.ocrText,
            visualDescription: r.visualDescription,
            sourceLabel: `Video Frame ${idx + 1}`,
            hasHandwriting: r.hasHandwriting,
            ocrConfidence: r.ocrConfidence,
            visualConfidence: r.visualConfidence,
            handwritingConfidence: r.handwritingConfidence,
            diagramConfidence: r.diagramConfidence,
            tableConfidence: r.tableConfidence,
            language: r.language,
          })),
        });

        finalKnowledgeText = fusionDoc.organizedContent;
        domains = fusionDoc.domains;
        topics = fusionDoc.topics;
        ocrConfidence = fusionDoc.ocrConfidence;
        visualConfidence = fusionDoc.visualConfidence;
      }

      if (!finalKnowledgeText || finalKnowledgeText.trim().length === 0) {
        throw new BadRequestException('No educational content could be understood from the uploaded file.');
      }

      // Generate Quiz with Bloom's weight profile + Topics Allocation + Domain Prompt constraints
      reportProgress('Generating quiz...', 90);
      const quiz = await this.aiContentGeneratorService.generateQuiz({
        text: finalKnowledgeText,
        difficulty,
        questionCount,
        language: language || 'English',
        domains,
        topics,
      });

      const processingTimeSeconds = Math.round((Date.now() - startTime) / 1000);
      this.logger.log(
        `[QUIZ_GENERATION_METRICS] RunId: ${runId}, FileType: ${fileType}, ProcessingTime: ${processingTimeSeconds}s, OCRConfidence: ${ocrConfidence}%, VisualConfidence: ${visualConfidence}%, ExtractedFrames: ${totalFramesExtracted}, AnalyzedFrames: ${totalFramesAnalyzed}, Domains: ${domains.join(', ')}, TopicsCount: ${topics.length}`
      );

      reportProgress('Finalizing...', 98);
      return quiz;

    } finally {
      // Clean up the entire run directory completely and immediately
      try {
        if (fs.existsSync(runDir)) {
          fs.rmSync(runDir, { recursive: true, force: true });
        }
      } catch (cleanupErr) {
        this.logger.error(`Failed to clean up run directory ${runDir}:`, cleanupErr);
      }
    }
  }
}
