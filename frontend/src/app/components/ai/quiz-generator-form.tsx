import React, { useState, useMemo } from "react";
import { FileUpload } from "../ui/file-upload";
import {
  AIQuizGeneratorService,
  FileType as ServiceFileType,
} from "../../services/ai-quiz-generator";
import { GeneratedQuiz } from "../admin-ai-quiz-generator";

export type FileType = "video" | "audio" | "document";

interface FileUploadConfig {
  acceptedFormats: string[];
  acceptedMimeTypes: string[];
  maxFileSizeMB: number;
}

export const FILE_UPLOAD_CONFIGS: Record<FileType, FileUploadConfig> = {
  video: {
    acceptedFormats: ["mp4", "mov", "avi", "mkv", "webm"],
    acceptedMimeTypes: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"],
    maxFileSizeMB: 250,
  },
  audio: {
    acceptedFormats: ["mp3", "wav", "m4a", "aac", "ogg"],
    acceptedMimeTypes: ["audio/mpeg", "audio/wav", "audio/mp4", "audio/aac", "audio/ogg"],
    maxFileSizeMB: 100,
  },
  document: {
    acceptedFormats: ["pdf", "doc", "docx", "txt", "ppt", "pptx"],
    acceptedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    maxFileSizeMB: 15,
  },
};

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard", "Mixed"] as const;
const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 25, 50, 100] as const;

interface QuizGeneratorFormProps {
  fileType: FileType;
  onQuizGenerated: (quiz: GeneratedQuiz) => void;
  onBack: () => void;
  // Shared parent state
  numQuestions: number;
  setNumQuestions: (n: number) => void;
  difficulty: string;
  setDifficulty: (d: string) => void;
  onFileStateChange?: (hasFile: boolean, isGenerating: boolean) => void;
}

interface GenerationState {
  isGenerating: boolean;
  uploadProgress: number;
  currentStage: string;
  error: string | null;
}

export function QuizGeneratorForm({
  fileType,
  onQuizGenerated,
  onBack,
  numQuestions,
  setNumQuestions,
  difficulty,
  setDifficulty,
  onFileStateChange,
}: QuizGeneratorFormProps) {
  const uploadConfig = FILE_UPLOAD_CONFIGS[fileType];
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    uploadProgress: 0,
    currentStage: "",
    error: null,
  });

  // Notify parent of file/generation state changes
  React.useEffect(() => {
    onFileStateChange?.(selectedFile !== null, generationState.isGenerating);
  }, [selectedFile, generationState.isGenerating]);

  const isFormValid = useMemo(() => {
    return selectedFile !== null && numQuestions >= 1 && numQuestions <= 100;
  }, [selectedFile, numQuestions]);

  const handleFileSelect = (file: File, controller?: AbortController) => {
    setSelectedFile(file);
    setGenerationState(prev => ({ ...prev, error: null }));
    if (controller) setAbortController(controller);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setGenerationState(prev => ({ ...prev, error: null }));
  };

  const handleCancel = () => {
    abortController?.abort();
    setGenerationState({
      isGenerating: false,
      uploadProgress: 0,
      currentStage: "",
      error: null,
    });
  };

  // Estimated processing time display helper
  const getEstimatedTime = () => {
    if (fileType === "video") return "Estimated time: 1-3 minutes (depends on video length for audio extraction & transcription)";
    if (fileType === "audio") return "Estimated time: 1-2 minutes (depends on audio length for transcription)";
    return "Estimated time: 15-30 seconds";
  };

  const handleGenerateQuiz = async () => {
    if (!isFormValid || !selectedFile) return;

    const controller = new AbortController();
    setAbortController(controller);

    setGenerationState({
      isGenerating: true,
      uploadProgress: 10,
      currentStage: "Uploading file...",
      error: null,
    });

    try {
      const quiz = await AIQuizGeneratorService.generateQuiz({
        file: selectedFile,
        fileType: fileType as ServiceFileType,
        numQuestions,
        difficulty: difficulty as any,
        controller,
        onProgress: (stage, progress) => {
          setGenerationState(prev => ({
            ...prev,
            currentStage: stage,
            uploadProgress: progress,
          }));
        },
      });

      onQuizGenerated(quiz);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate quiz";
      setGenerationState(prev => ({
        ...prev,
        error: errorMessage,
        isGenerating: false,
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-lg font-bold text-gray-900 capitalize">{fileType} Quiz Generator</h2>
      </div>

      <FileUpload
        fileType={fileType}
        acceptedFormats={uploadConfig.acceptedFormats}
        acceptedMimeTypes={uploadConfig.acceptedMimeTypes}
        maxFileSizeMB={uploadConfig.maxFileSizeMB}
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        onCancel={handleCancel}
        uploadProgress={generationState.uploadProgress}
        isUploading={generationState.isGenerating && generationState.currentStage === "Uploading file..."}
        isProcessing={generationState.isGenerating && generationState.currentStage !== "Uploading file..."}
        processingStage={generationState.currentStage}
        error={generationState.error || undefined}
      />

      {generationState.isGenerating && (
        <div className="text-xs text-purple-600 bg-purple-50 p-3 rounded-lg border border-purple-100 text-center animate-pulse font-medium">
          {getEstimatedTime()}
        </div>
      )}

      {selectedFile && !generationState.isGenerating && (
        <button
          id="quiz-generator-form-trigger"
          onClick={handleGenerateQuiz}
          disabled={!isFormValid}
          className="hidden"
        >
          Generate Quiz
        </button>
      )}
    </div>
  );
}
