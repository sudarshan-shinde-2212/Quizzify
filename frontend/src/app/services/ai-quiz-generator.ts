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

export type FileType = "video" | "audio" | "document";
export type Difficulty = "Easy" | "Medium" | "Hard" | "Mixed";
export type QuestionType = "MCQ" | "True/False" | "Fill in the Blanks" | "Mixed";

export interface AIQuizGeneratorParams {
  file: File;
  fileType: FileType;
  numQuestions: number;
  difficulty: Difficulty;
  questionType: QuestionType;
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
      questionType,
      controller,
      onProgress,
    } = params;

    onProgress?.("Uploading file...", 10);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);
    formData.append("questionCount", numQuestions.toString());
    formData.append("difficulty", difficulty);
    formData.append("questionType", questionType);

    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Sending request to:', `${BASE_URL}/admin/generate-quiz-from-file`);
      console.log('FormData entries:', [...formData.entries()]);

      const response = await fetch(`${BASE_URL}/admin/generate-quiz-from-file`, {
        method: "POST",
        body: formData,
        signal: controller?.signal,
        headers,
      });

      console.log('Response status:', response.status, response.statusText);
      onProgress?.("Processing file...", 40);

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorJson = await response.json();
          console.log('Error response JSON:', errorJson);
          errorDetail = JSON.stringify(errorJson);
        } catch {
          errorDetail = await response.text();
          console.log('Error response text:', errorDetail);
        }
        throw new Error(`Failed to generate quiz: ${response.statusText} - ${errorDetail}`);
      }

      onProgress?.("Generating questions...", 70);
      const data = await response.json();
      console.log('Response data:', data);

      onProgress?.("Validating quiz...", 90);
      const validatedQuiz = GeneratedQuizSchema.parse(data);

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
