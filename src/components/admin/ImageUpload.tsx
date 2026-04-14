"use client";

import { useState, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { handleImageUpload } from "@/lib/file-actions";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await handleImageUpload(formData);
      onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={isUploading}
      />

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Product image"
            className="h-32 w-auto rounded-lg border border-[#333] object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <Icon name="X" className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-32 border-2 border-dashed border-[#333] hover:border-[#f59e0b]/50 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[#f59e0b] transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Icon name="Loader2" className="w-6 h-6 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <Icon name="Upload" className="w-6 h-6" />
              <span className="text-sm">Click to upload image</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <p className="text-xs text-gray-500">
        Recommended: 600x400px, max 5MB (JPEG, PNG, WebP, GIF)
      </p>
    </div>
  );
}
