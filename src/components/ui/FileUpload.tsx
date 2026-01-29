"use client";

import { useState, useCallback } from "react";
import { CloudUpload, X } from "lucide-react";

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
  className?: string;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export default function FileUpload({
  accept = ".jar",
  maxSize = 50 * 1024 * 1024, // 50MB default
  multiple = false,
  onFilesChange,
  className = "",
  label = "Upload File",
  description = "Upload a JAR file",
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const validateFiles = useCallback((newFiles: FileList) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(newFiles).forEach((file) => {
      // Check file type
      if (accept && !file.name.toLowerCase().endsWith(accept.replace("*", ""))) {
        errors.push(`${file.name} is not a valid file type`);
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name} is too large (max ${(maxSize / 1024 / 1024).toFixed(1)}MB)`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join(", "));
      return [];
    }

    setError(null);
    return validFiles;
  }, [accept, maxSize]);

  const handleFiles = useCallback((newFiles: File[]) => {
    let updatedFiles: File[];
    
    if (multiple) {
      updatedFiles = [...files, ...newFiles];
    } else {
      updatedFiles = newFiles;
    }
    
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  }, [files, multiple, onFilesChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      handleFiles(validFiles);
    }
    
    // Clear input
    e.target.value = "";
  }, [validateFiles, handleFiles]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!e.dataTransfer.files) return;
    
    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      handleFiles(validFiles);
    }
  }, [validateFiles, handleFiles]);

  const removeFile = useCallback((index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  }, [files, onFilesChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive 
            ? "border-emerald-500 bg-emerald-500/10" 
            : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
        
        <CloudUpload className="mx-auto h-12 w-12 text-gray-400" />
        
        <div className="mt-4">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-gray-400 mt-1">{description}</p>
          <p className="text-xs text-gray-500 mt-2">
            Max file size: {(maxSize / 1024 / 1024).toFixed(1)}MB
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-3">
          <p className="text-sm text-blue-300">{uploadProgress}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-300">Selected Files:</p>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-3 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}