import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

export interface FusionInput {
  documentText?: string;
  audioTranscript?: string;
  visionResults?: Array<{
    ocrText: string;
    visualDescription: string;
    sourceLabel: string;
    hasHandwriting: boolean;
    ocrConfidence?: number;
    visualConfidence?: number;
    handwritingConfidence?: number;
    diagramConfidence?: number;
    tableConfidence?: number;
    language?: string;
  }>;
  sourceFileType: string;
  questionCount: number;
}

export interface TopicAllocation {
  name: string;
  coveragePercent: number;
  conceptCount: number;
  allocatedQuestions: number;
  content: string;
}

export interface KnowledgeDocument {
  organizedContent: string;
  sourceTypes: string[];
  fusionSucceeded: boolean;
  domains: string[];
  topics: TopicAllocation[];
  ocrConfidence: number;
  visualConfidence: number;
}

@Injectable()
export class KnowledgeFusionService {
  private readonly groq: Groq;
  private readonly logger = new Logger(KnowledgeFusionService.name);

  constructor(private readonly configService: ConfigService) {
    this.groq = new Groq({ apiKey: this.configService.get<string>('GROQ_API_KEY') });
  }

  async buildKnowledgeDocument(input: FusionInput): Promise<KnowledgeDocument> {
    const rawParts: string[] = [];
    const sourceTypes: string[] = [];

    // ── 1. Calculate Confidence Metrics ─────────────────────────────────────
    let totalOcrConfidence = 0;
    let totalVisualConfidence = 0;
    let visionCount = 0;

    if (input.documentText?.trim()) {
      rawParts.push(`=== EXTRACTED DOCUMENT TEXT ===\n${input.documentText.trim()}`);
      sourceTypes.push('document-text');
    }

    if (input.audioTranscript?.trim()) {
      rawParts.push(`=== AUDIO NARRATION / LECTURE TRANSCRIPT ===\n${input.audioTranscript.trim()}`);
      sourceTypes.push('audio-transcript');
    }

    if (input.visionResults?.length) {
      const meaningful = input.visionResults.filter(
        v => (v.ocrText?.trim() || v.visualDescription?.trim()),
      );

      if (meaningful.length > 0) {
        const visionBlock = meaningful
          .map((v, i) => {
            const label = v.sourceLabel || `Item ${i + 1}`;
            const hwNote = v.hasHandwriting ? ' [contains handwriting]' : '';
            const body = v.ocrText?.trim() || v.visualDescription?.trim() || '';
            
            if (v.ocrConfidence !== undefined) {
              totalOcrConfidence += v.ocrConfidence;
              totalVisualConfidence += (v.visualConfidence ?? 85);
              visionCount++;
            }

            return `--- ${label}${hwNote} ---\n${body}`;
          })
          .join('\n\n');

        rawParts.push(`=== VISUAL CONTENT (OCR + Vision Analysis) ===\n${visionBlock}`);
        sourceTypes.push('vision-ocr');
      }
    }

    // Default confidences
    let avgOcrConfidence = input.documentText ? 100 : 85;
    let avgVisualConfidence = 85;

    if (visionCount > 0) {
      avgOcrConfidence = Math.round(totalOcrConfidence / visionCount);
      avgVisualConfidence = Math.round(totalVisualConfidence / visionCount);
    }

    if (rawParts.length === 0) {
      return {
        organizedContent: '',
        sourceTypes: [],
        fusionSucceeded: false,
        domains: ['General Knowledge'],
        topics: [],
        ocrConfidence: 0,
        visualConfidence: 0,
      };
    }

    const rawContent = rawParts.join('\n\n');

    // ── 2. Run LLM Fusion with Two-Pass Logic ──────────────────────────────
    try {
      const fusionResult = await this.runFusionPass(rawContent, input.sourceFileType, sourceTypes, avgOcrConfidence);
      
      // Proportionally allocate question counts based on coverage weights
      const totalAllocated = this.allocateQuestions(fusionResult.topics, input.questionCount);

      // Reassemble organizedContent text for backward compatibility
      const organizedContent = totalAllocated
        .map(t => `## Topic: ${t.name} (${t.coveragePercent}% weight - ${t.allocatedQuestions} questions)\n\n${t.content}`)
        .join('\n\n');

      return {
        organizedContent,
        sourceTypes,
        fusionSucceeded: true,
        domains: fusionResult.domains,
        topics: totalAllocated,
        ocrConfidence: avgOcrConfidence,
        visualConfidence: avgVisualConfidence,
      };
    } catch (error: any) {
      this.logger.warn(`Knowledge fusion LLM pass failed, using fallback structuring: ${error.message}`);
      
      // Basic fallback structuring
      const fallbackTopic: TopicAllocation = {
        name: 'Overview',
        coveragePercent: 100,
        conceptCount: 10,
        allocatedQuestions: input.questionCount,
        content: rawContent,
      };

      return {
        organizedContent: rawContent,
        sourceTypes,
        fusionSucceeded: false,
        domains: ['General Knowledge'],
        topics: [fallbackTopic],
        ocrConfidence: avgOcrConfidence,
        visualConfidence: avgVisualConfidence,
      };
    }
  }

  // ── Proportional Question Allocation Algorithm ──────────────────────────────

  private allocateQuestions(topics: any[], totalQuestions: number): TopicAllocation[] {
    if (topics.length === 0) return [];

    let allocatedSum = 0;
    const allocations = topics.map(t => {
      // Proportional math: ensure at least 1 question per topic
      const count = Math.max(1, Math.round(totalQuestions * (t.coveragePercent / 100)));
      allocatedSum += count;
      return {
        name: t.name,
        coveragePercent: t.coveragePercent,
        conceptCount: t.conceptCount ?? 5,
        content: t.content,
        allocatedQuestions: count,
      };
    });

    // Resolve rounding mismatch against the topic with largest weight
    let diff = totalQuestions - allocatedSum;
    if (diff !== 0) {
      const largestTopic = allocations.reduce((prev, current) => 
        (prev.coveragePercent > current.coveragePercent) ? prev : current
      );
      // Ensure we don't drop questions below 1
      largestTopic.allocatedQuestions = Math.max(1, largestTopic.allocatedQuestions + diff);
    }

    return allocations;
  }

  // ── Groq LLM Pass ─────────────────────────────────────────────────────────

  private async runFusionPass(
    rawContent: string,
    sourceFileType: string,
    sourceTypes: string[],
    ocrConfidence: number,
  ): Promise<{ domains: string[]; topics: Array<{ name: string; coveragePercent: number; conceptCount: number; content: string }> }> {
    const MAX_CHARS = 28_000;
    const truncated = rawContent.length > MAX_CHARS
      ? rawContent.slice(0, MAX_CHARS) + '\n\n[Content truncated — size exceeded]'
      : rawContent;

    const confidenceWarning = ocrConfidence < 75
      ? `\nWARNING: The raw OCR text has a low confidence score of ${ocrConfidence}%. Treat spelling and transcription typos with skepticism. Rely heavily on visual descriptions and context to resolve errors.\n`
      : '';

    const prompt = `You are a professional educational assessor and knowledge engineer. Combine the raw content extracted from a "${sourceFileType}" file into a unified knowledge structure.

RAW CONTENT:
${truncated}
${confidenceWarning}

INSTRUCTIONS:
1. Classify the content into one or more educational DOMAINS (e.g. "Programming", "Database", "Mathematics").
2. Partition the content into 3 to 5 logical topics/sections.
3. For each topic:
   - Identify its estimated weight/coverage percentage (the sum of coveragePercent for all topics MUST be exactly 100).
   - Estimate the concept count.
   - Generate a consolidated, clean educational summary/content body covering all definitions, formulas, programming snippets, relationships, tables, and facts in rich detail.
4. Correct OCR transcription errors using context.
5. If table or diagram structures are present, represent them clearly in Markdown format.

Return ONLY a valid JSON object matching this schema exactly, with NO markdown formatting or extra text:
{
  "domains": ["Domain1", "Domain2"],
  "topics": [
    {
      "name": "Topic Name",
      "coveragePercent": number,
      "conceptCount": number,
      "content": "Consolidated educational summary..."
    }
  ]
}`;

    const response = await this.groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    if (!parsed.domains || !Array.isArray(parsed.topics) || parsed.topics.length === 0) {
      throw new Error('LLM output format mismatch');
    }

    // Verify coveragePercent sums to 100
    const sum = parsed.topics.reduce((acc: number, t: any) => acc + (t.coveragePercent || 0), 0);
    if (sum !== 100 && parsed.topics.length > 0) {
      // Normalize to 100% proportionally if sum is off
      parsed.topics.forEach((t: any) => {
        t.coveragePercent = Math.round((t.coveragePercent / sum) * 100);
      });
      // Adjust last element rounding
      const reSum = parsed.topics.reduce((acc: number, t: any) => acc + t.coveragePercent, 0);
      if (reSum !== 100) {
        parsed.topics[parsed.topics.length - 1].coveragePercent += (100 - reSum);
      }
    }

    return parsed;
  }
}
