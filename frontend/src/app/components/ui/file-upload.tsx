import React, { useRef, useState, useCallback } from "react";
import {
  Upload,
  X,
  Loader2,
  Video,
  Mic,
  FileText,
  File,
  LucideIcon,
} from "lucide-react";

// Assuming your project uses sonner for toast notifications
import { toast } from "sonner";

interface FileUploadProps {
  acceptedFormats: string[];
  acceptedMimeTypes: string[];
  maxFiles?: number;
  maxFileSizeMB: number;
  onFileSelect: (file: File, controller?: AbortController) => void;
  onFileRemove: () => void;
  onCancel?: () => void;
  selectedFile: File | null;
  uploadProgress: number;
  isUploading: boolean;
  isProcessing?: boolean;
  processingStage?: string;
  error?: string;
  placeholder?: string;
  fileType: "video" | "audio" | "document";
}

const getFileTypeIcon = (type: "video" | "audio" | "document", ext?: string): LucideIcon => {
  if (type === "video") return Video;
  if (type === "audio") return Mic;

  const docIconMap: Record<string, LucideIcon> = {
    pdf: FileText,
    doc: File,
    docx: File,
    txt: File,
    ppt: File,
    pptx: File,
  };

  if (ext && docIconMap[ext]) {
    return docIconMap[ext];
  }

  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function FileUpload({
  acceptedFormats,
  acceptedMimeTypes,
  maxFiles = 1,
  maxFileSizeMB,
  onFileSelect,
  onFileRemove,
  onCancel,
  selectedFile,
  uploadProgress,
  isUploading,
  isProcessing = false,
  processingStage = "Processing file...",
  error,
  placeholder = "Drag and drop file here or click to browse",
  fileType,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    let isValidMimeType = acceptedMimeTypes.includes(file.type);
    if (!isValidMimeType && !file.type) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      isValidMimeType = ext ? acceptedFormats.includes(ext) : false;
    }

    if (!isValidMimeType) {
      return `Invalid file type. Please upload one of: ${acceptedFormats.join(", ")}`;
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      return `Invalid file extension. Please upload one of: ${acceptedFormats.join(", ")}`;
    }

    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxFileSizeBytes) {
      return `File too large. Maximum size is ${maxFileSizeMB}MB.`;
    }

    if (file.size === 0) {
      return "File is empty. Please upload a valid file.";
    }

    return null;
  }, [acceptedFormats, acceptedMimeTypes, maxFileSizeMB]);

  const handleSelectFile = useCallback((file: File) => {
    if (isUploading || isProcessing) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError, {
        description: (
          <div className="mt-1 text-xs space-y-1">
            <p>Supported formats:</p>
            <ul className="list-disc list-inside">
              {acceptedFormats.map((f) => (
                <li key={f}>{f.toUpperCase()}</li>
              ))}
            </ul>
            <p className="mt-2">Maximum size: {maxFileSizeMB} MB</p>
          </div>
        ),
      });
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    abortControllerRef.current = new AbortController();
    onFileSelect(file, abortControllerRef.current);
  }, [validateFile, isUploading, isProcessing, onFileSelect, acceptedFormats, maxFileSizeMB]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isUploading && !isProcessing && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files.length > maxFiles) {
        toast.error(`Please upload no more than ${maxFiles} file(s)`);
        return;
      }
      handleSelectFile(e.dataTransfer.files[0]);
    }
  }, [isUploading, isProcessing, maxFiles, handleSelectFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isUploading && !isProcessing && e.target.files && e.target.files[0]) {
      if (e.target.files.length > maxFiles) {
        toast.error(`Please upload no more than ${maxFiles} file(s)`);
        return;
      }
      handleSelectFile(e.target.files[0]);
    }
  }, [isUploading, isProcessing, maxFiles, handleSelectFile]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isUploading && !isProcessing && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }, [isUploading, isProcessing]);

  const handleCancel = useCallback(() => {
    if (isUploading || isProcessing) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      onCancel?.();
    }
  }, [isUploading, isProcessing, onCancel]);

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUploading || isProcessing) return;
    onFileRemove();
  }, [isUploading, isProcessing, onFileRemove]);

  const ext = selectedFile ? selectedFile.name.split(".").pop()?.toLowerCase() : undefined;
  const IconComponent = selectedFile ? getFileTypeIcon(fileType, ext) : Upload;

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && !isProcessing && fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Upload file"
        aria-describedby="supported-formats"
        aria-disabled={isUploading || isProcessing}
        className={`border-2 border-dashed rounded-xl p-5 md:p-8 text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
          isDragging
            ? "border-purple-500 bg-purple-50/50 scale-105 shadow-lg"
            : isUploading || isProcessing
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : "border-gray-300 hover:border-purple-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedMimeTypes.join(",")}
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isUploading || isProcessing}
        />

        {isUploading || isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={36} className="animate-spin text-purple-600" />
            <p className="text-sm font-medium text-gray-700">
              {isProcessing ? processingStage : "Uploading..."}
            </p>
            {uploadProgress > 0 && (
              <div className="w-full max-w-xs">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{Math.round(uploadProgress)}%</p>
              </div>
            )}
            {onCancel && (
              <button
                onClick={handleCancel}
                className="mt-2 px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <IconComponent
              size={36}
              className={selectedFile ? "text-purple-600" : "text-gray-400"}
            />
            <p className="text-sm font-medium text-gray-700">
              {selectedFile ? "Click or drag to replace file" : placeholder}
            </p>
            <p id="supported-formats" className="text-xs text-gray-500">
              Max size: {maxFileSizeMB}MB • Supported: {acceptedFormats.join(", ").toUpperCase()}
            </p>
          </div>
        )}
      </div>

      {selectedFile && !isUploading && !isProcessing && (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-200">
                <IconComponent size={20} className="text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 hover:bg-white hover:border hover:border-gray-200 rounded-lg transition-colors shrink-0"
              aria-label="Remove file"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-4 rounded-xl">
          <p className="font-medium mb-2">❌ {error}</p>
          <div className="space-y-1 text-gray-600">
            <p>Supported formats:</p>
            <ul className="list-disc list-inside">
              {acceptedFormats.map((f) => (
                <li key={f}>{f.toUpperCase()}</li>
              ))}
            </ul>
            <p className="mt-2">Maximum size: {maxFileSizeMB} MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
