import { z } from "zod";
import { getToken } from "../components/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export const GeneratedQuestionSchema = z.object({
  question: z.string().min(5),
  imageUrl: z.string().optional(),
  options: z.array(z.string()).min(2).max(6),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(10).optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard", "Mixed"]).optional(),
  marks: z.number().int().positive().optional(),
});

export const GeneratedQuizSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(500),
  questions: z.array(GeneratedQuestionSchema).min(1),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
export type GeneratedQuiz = z.infer<typeof GeneratedQuizSchema>;

export type FileType = "video" | "audio" | "document" | "image";
export type Difficulty = "Easy" | "Medium" | "Hard" | "Mixed";

export interface AIQuizGeneratorParams {
  file: File;
  fileType: FileType;
  numQuestions: number;
  difficulty: Difficulty;
  controller?: AbortController;
  onProgress?: (stage: string, progress: number) => void;
}

export class AIQuizGeneratorService {
  static async generateQuiz(params: AIQuizGeneratorParams): Promise<GeneratedQuiz> {
    const {
      file,
      fileType,
      numQuestions,
      difficulty,
      controller,
      onProgress,
    } = params;

    onProgress?.("Uploading file...", 5);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);
    formData.append("questionCount", numQuestions.toString());
    formData.append("difficulty", difficulty);

    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Sending request to:', `${BASE_URL}/admin/generate-quiz-from-file`);
      
      const response = await fetch(`${BASE_URL}/admin/generate-quiz-from-file`, {
        method: "POST",
        body: formData,
        signal: controller?.signal,
        headers,
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorJson = await response.json();
          errorDetail = errorJson.message || JSON.stringify(errorJson);
        } catch {
          errorDetail = await response.text();
        }
        throw new Error(errorDetail || response.statusText);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let quizData: any = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep the last incomplete block in buffer

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk = JSON.parse(line);
              if (chunk.error) {
                throw new Error(chunk.error);
              }
              if (chunk.stage && chunk.progress !== undefined) {
                onProgress?.(chunk.stage, chunk.progress);
              }
              if (chunk.quiz) {
                quizData = chunk.quiz;
              }
            } catch (err: any) {
              if (err.message && (err.message.includes("Failed") || err.message.includes("error") || err.message.includes("limit") || err.message.includes("large") || err.message.includes("Empty") || err.message.includes("Unreadable") || err.message.includes("Unsupport")) ) {
                throw err;
              }
              // Ignore JSON parse errors for split chunk lines
            }
          }
        }

        // Process leftover buffer
        if (buffer.trim()) {
          try {
            const chunk = JSON.parse(buffer);
            if (chunk.error) {
              throw new Error(chunk.error);
            }
            if (chunk.quiz) {
              quizData = chunk.quiz;
            }
          } catch (err: any) {
            if (err.message && (err.message.includes("Failed") || err.message.includes("limit") || err.message.includes("large") || err.message.includes("Unreadable"))) {
              throw err;
            }
          }
        }
      } else {
        // Fallback for environment without body stream reader
        const fallbackData = await response.json();
        quizData = fallbackData.quiz;
      }

      if (!quizData) {
        throw new Error("Failed to extract quiz content from response stream");
      }

      onProgress?.("Validating quiz...", 95);
      const validatedQuiz = GeneratedQuizSchema.parse(quizData);

      onProgress?.("Quiz ready!", 100);
      return validatedQuiz;
    } catch (error: unknown) {
      console.error('Quiz generation error:', error);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Quiz generation cancelled by user");
      }
      if (error instanceof z.ZodError) {
        console.error("Quiz validation failed:", error.issues);
        throw new Error("AI returned invalid quiz format. Please try again.");
      }
      throw new Error(error instanceof Error ? error.message : "Failed to generate quiz");
    }
  }
}
