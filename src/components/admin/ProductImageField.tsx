"use client";

import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { handleImageUpload } from "@/lib/file-actions";

interface ProductImageFieldProps {
  name: string;
  defaultValue: string;
}

export default function ProductImageField({ name, defaultValue }: ProductImageFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await handleImageUpload(formData);
      setValue(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Product Image
      </label>
      
      <input type="hidden" name={name} value={value} />

      {value ? (
        <div className="relative inline-block group">
          <img
            src={value}
            alt="Product image"
            className="h-32 w-auto rounded-lg border border-[#333] object-cover"
          />
          <button
            type="button"
            onClick={() => setValue("")}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="w-full h-32 border-2 border-dashed border-[#333] hover:border-[#f59e0b]/50 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[#f59e0b] transition-colors cursor-pointer">
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6" />
              <span className="text-sm">Click to upload image</span>
            </>
          )}
        </label>
      )}

      {error && (
        <p className="text-red-400 text-sm mt-2">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Recommended: 600x400px, max 5MB (JPEG, PNG, WebP, GIF)
      </p>
    </div>
  );
}
