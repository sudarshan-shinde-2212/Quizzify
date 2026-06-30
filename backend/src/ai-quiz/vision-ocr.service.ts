import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { spawn } from 'child_process';

export interface VisionAnalysisResult {
  ocrText: string;
  visualDescription: string;
  contentType: string;
  hasHandwriting: boolean;
  ocrConfidence?: number;
  visualConfidence?: number;
  handwritingConfidence?: number;
  diagramConfidence?: number;
  tableConfidence?: number;
  language?: string;
}

const VISION_MODEL = 'llama-3.2-11b-vision-preview';
// 15 MB binary → ~20 MB base64; keep well under Groq limit
const MAX_IMAGE_BYTES_BEFORE_RESIZE = 10 * 1024 * 1024;

@Injectable()
export class VisionOcrService {
  private readonly groq: Groq;
  private readonly logger = new Logger(VisionOcrService.name);
  /** Key: content fingerprint → cached result */
  private readonly resultCache = new Map<string, VisionAnalysisResult>();

  constructor(private readonly configService: ConfigService) {
    this.groq = new Groq({ apiKey: this.configService.get<string>('GROQ_API_KEY') });
  }

  // ── Cache helpers ──────────────────────────────────────────────────────────

  /**
   * Fast fingerprint: sample 256 bytes from 4 positions + file size.
   */
  private computeFingerprint(imagePath: string): string {
    try {
      const buf = fs.readFileSync(imagePath);
      const size = buf.length;
      const positions = [0, Math.floor(size * 0.25), Math.floor(size * 0.5), Math.floor(size * 0.75)];
      const sample = Buffer.concat(positions.map(p => buf.slice(p, Math.min(p + 64, size))));
      return crypto.createHash('md5').update(sample).update(String(size)).digest('hex');
    } catch {
      return crypto.randomBytes(8).toString('hex');
    }
  }

  // ── Image preprocessing ────────────────────────────────────────────────────

  private async resizeIfNeeded(
    imagePath: string,
    tempDir: string,
  ): Promise<{ usePath: string; isTemp: boolean }> {
    const stats = fs.statSync(imagePath);
    if (stats.size <= MAX_IMAGE_BYTES_BEFORE_RESIZE) {
      return { usePath: imagePath, isTemp: false };
    }

    const ext = path.extname(imagePath) || '.jpg';
    const resizedPath = path.join(tempDir, `resized-${Date.now()}${ext}`);

    await new Promise<void>((resolve, reject) => {
      const ff = spawn('ffmpeg', [
        '-i', imagePath,
        '-vf', 'scale=1280:-1',
        '-q:v', '4',
        '-y', resizedPath,
      ]);
      let done = false;
      ff.on('close', code => { if (!done) { done = true; code === 0 ? resolve() : reject(new Error('resize failed')); } });
      ff.on('error', e => { if (!done) { done = true; reject(e); } });
    });

    return { usePath: resizedPath, isTemp: true };
  }

  // ── Core analysis ──────────────────────────────────────────────────────────

  async analyzeImage(imagePath: string, context?: string): Promise<VisionAnalysisResult> {
    const fingerprint = this.computeFingerprint(imagePath);
    if (this.resultCache.has(fingerprint)) {
      this.logger.debug(`Vision cache hit: ${path.basename(imagePath)}`);
      return this.resultCache.get(fingerprint)!;
    }

    const tempDir = path.dirname(imagePath);
    let resizeInfo: { usePath: string; isTemp: boolean } | null = null;

    try {
      resizeInfo = await this.resizeIfNeeded(imagePath, tempDir).catch(() => ({
        usePath: imagePath,
        isTemp: false,
      }));

      const imageBuffer = fs.readFileSync(resizeInfo.usePath);
      const ext = path.extname(resizeInfo.usePath).toLowerCase().replace('.', '') || 'jpg';
      const mime = this.extToMime(ext);
      const base64 = imageBuffer.toString('base64');

      const contextNote = context ? `[Source context: ${context}]\n\n` : '';

      const prompt = `${contextNote}You are an expert multimodal educational content analyzer. Your task is to extract ALL educational content from this image so that quiz questions can be generated from it.

Be EXHAUSTIVE — do not skip anything.

━━ SECTION 1: TEXT EXTRACTION (OCR) ━━
Extract every piece of visible text EXACTLY as written:
• Printed text (books, slides, handouts, worksheets, exams)
• Handwritten text — prefix each handwritten block with "HANDWRITTEN:"
• Mathematical equations and formulas (use LaTeX-like notation: x^2 + y^2 = r^2 or $$E = mc^2$$)
• Chemical formulas and reaction equations
• Code snippets (preserve indentation and syntax)
• Labels, captions, legends, axis titles, table headers
• Any text on whiteboards, blackboards, sticky notes, or screen captures

Preserve structure: use headings, bullets, numbered lists, and table layout where present.

━━ SECTION 2: VISUAL CONTENT ANALYSIS ━━
For every non-text visual element, provide a detailed description that captures its EDUCATIONAL content:
• Diagrams and flowcharts: describe nodes, edges, labels, and the process/relationship shown
• Charts and graphs: state type (bar/pie/line/scatter), axes, key values, trends, and what they illustrate
• Tables: reproduce header row and key data rows; state what the table demonstrates
• Scientific figures (anatomy, biology, physics, chemistry, circuits): describe components and relationships
• Maps: identify regions, labels, and geographic/political relationships shown
• UI screenshots: describe key elements and their purpose
• Infographics: extract all labeled facts, statistics, and relationships

━━ SECTION 3: EDUCATIONAL SIGNIFICANCE ━━
• Subject area and specific topic
• Key concepts, definitions, and important facts found
• Formulas, laws, or theorems present
• 3–5 specific quiz question ideas this content could generate

━━ SECTION 4: CONFIDENCE ESTIMATION ━━
Estimate your confidence (on a scale of 0 to 100) for different parts of this document. Return this exact JSON block at the VERY end of your response, starting with "METADATA_JSON_START" and ending with "METADATA_JSON_END".

METADATA_JSON_START
{
  "ocrConfidence": number,
  "visualConfidence": number,
  "handwritingConfidence": number,
  "diagramConfidence": number,
  "tableConfidence": number,
  "handwritingDetected": boolean,
  "language": "string"
}
METADATA_JSON_END`;

      const response = await this.groq.chat.completions.create({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
              { type: 'text', text: prompt },
            ] as any,
          },
        ],
        temperature: 0.1,
        max_tokens: 3000,
      });

      const rawContent = response.choices[0]?.message?.content?.trim() || '';
      
      let ocrConfidence = 85;
      let visualConfidence = 85;
      let handwritingConfidence = 50;
      let diagramConfidence = 50;
      let tableConfidence = 50;
      let handwritingDetected = /handwritten:/i.test(rawContent);
      let language = 'English';
      let cleanText = rawContent;

      const metaMatch = rawContent.match(/METADATA_JSON_START\s*(\{[\s\S]*?\})\s*METADATA_JSON_END/);
      if (metaMatch) {
        try {
          const meta = JSON.parse(metaMatch[1]);
          ocrConfidence = meta.ocrConfidence ?? 85;
          visualConfidence = meta.visualConfidence ?? 85;
          handwritingConfidence = meta.handwritingConfidence ?? 50;
          diagramConfidence = meta.diagramConfidence ?? 50;
          tableConfidence = meta.tableConfidence ?? 50;
          handwritingDetected = meta.handwritingDetected ?? handwritingDetected;
          language = meta.language ?? 'English';
          
          cleanText = rawContent.replace(metaMatch[0], '').trim();
        } catch (e: any) {
          this.logger.warn(`Failed to parse vision confidence metadata block: ${e.message}`);
        }
      }

      const result: VisionAnalysisResult = {
        ocrText: cleanText,
        visualDescription: cleanText,
        contentType: this.classifyContent(cleanText),
        hasHandwriting: handwritingDetected,
        ocrConfidence,
        visualConfidence,
        handwritingConfidence,
        diagramConfidence,
        tableConfidence,
        language,
      };

      this.resultCache.set(fingerprint, result);
      return result;

    } catch (error: any) {
      this.logger.warn(`Vision analysis failed for ${path.basename(imagePath)}: ${error.message}`);
      return { ocrText: '', visualDescription: '', contentType: 'unknown', hasHandwriting: false };
    } finally {
      if (resizeInfo?.isTemp) {
        try { fs.unlinkSync(resizeInfo.usePath); } catch { /* ignore */ }
      }
    }
  }

  async analyzeImagesBatch(
    imagePaths: string[],
    context?: string,
    concurrency = 4,
    onFrameComplete?: (done: number, total: number) => void,
  ): Promise<VisionAnalysisResult[]> {
    const results: VisionAnalysisResult[] = new Array(imagePaths.length);
    let done = 0;

    for (let i = 0; i < imagePaths.length; i += concurrency) {
      const batch = imagePaths.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(p => this.analyzeImage(p, context))
      );
      batchResults.forEach((r, j) => { results[i + j] = r; });
      done += batch.length;
      onFrameComplete?.(done, imagePaths.length);

      if (i + concurrency < imagePaths.length) {
        await new Promise(r => setTimeout(r, 400));
      }
    }

    return results;
  }

  private extToMime(ext: string): string {
    const map: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg',
      png: 'image/png', webp: 'image/webp', gif: 'image/gif',
    };
    return map[ext] ?? 'image/jpeg';
  }

  private classifyContent(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('whiteboard') || lower.includes('blackboard') || lower.includes('chalkboard')) return 'whiteboard';
    if (/handwritten:/i.test(text)) return 'handwritten';
    if (lower.includes('slide') || lower.includes('presentation')) return 'slide';
    if (lower.includes('flowchart') || lower.includes('flow chart')) return 'flowchart';
    if (lower.includes('diagram')) return 'diagram';
    if (lower.includes('chart') || lower.includes('graph')) return 'chart';
    if (lower.includes('table')) return 'table';
    if (lower.includes('equation') || lower.includes('formula') || lower.includes('theorem')) return 'equation';
    if (lower.includes('code') || lower.includes('function') || lower.includes('class ') || lower.includes('def ')) return 'code';
    return 'mixed';
  }

  clearCache(): void {
    this.resultCache.clear();
  }
}
