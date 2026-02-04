"use client";

import { useState } from "react";
import { UploadCloud, X, Save } from "lucide-react";
import FileUpload from "@/components/ui/FileUpload";
import { handleFileUpload } from "@/lib/file-actions";
import { updateVersionJar } from "@/app/admin/products/[id]/versions/actions";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface UpdateVersionJarButtonProps {
  versionId: string;
  productId: string;
  versionLabel: string;
}

export function UpdateVersionJarButton({
  versionId,
  productId,
  versionLabel,
}: UpdateVersionJarButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resetState = () => {
    setUploadedFiles([]);
    setDownloadUrl("");
    setFileSize("");
    setError("");
    setIsSubmitting(false);
  };

  const closeModal = () => {
    resetState();
    setOpen(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      let finalUrl = downloadUrl.trim();
      let finalSize = parseInt(fileSize, 10) || 0;

      if (uploadedFiles.length > 0) {
        const file = uploadedFiles[0];
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        const uploadResult = await handleFileUpload(uploadFormData);
        finalUrl = uploadResult.url;
        finalSize = uploadResult.size;
      } else {
        if (!finalUrl || !finalSize) {
          throw new Error("Please upload a JAR file or provide URL and file size.");
        }
      }

      await updateVersionJar({
        versionId,
        productId,
        downloadUrl: finalUrl,
        fileSize: finalSize,
      });

      closeModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update JAR");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[#f59e0b] hover:text-[#d97706] p-2 hover:bg-[#f59e0b]/10 rounded-lg transition-colors border border-transparent hover:border-[#f59e0b]/20"
        title="Update JAR"
      >
        <UploadCloud className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#111] rounded-xl border border-[#222] w-full max-w-lg p-6 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#f59e0b]" />
                Update JAR - v{versionLabel}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#1a1a1a]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Plugin File
                </label>
                <FileUpload
                  accept=".jar"
                  maxSize={MAX_FILE_SIZE}
                  multiple={false}
                  onFilesChange={(files) => setUploadedFiles(files)}
                  label="Upload JAR File"
                  description="Drop your plugin JAR file here or click to browse"
                  className="mb-2"
                  inputId={`jar-update-${versionId}`}
                />
              </div>

              <div className="border-t border-[#222] pt-4">
                <p className="text-xs text-gray-500 mb-3">
                  Or provide a direct download URL if you prefer not to upload.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Download URL
                    </label>
                    <input
                      type="url"
                      value={downloadUrl}
                      onChange={(e) => setDownloadUrl(e.target.value)}
                      disabled={uploadedFiles.length > 0}
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]/60 transition-colors disabled:opacity-60"
                      placeholder="https://storage.example.com/plugin-1.0.0.jar"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      File Size (bytes)
                    </label>
                    <input
                      type="number"
                      value={fileSize}
                      onChange={(e) => setFileSize(e.target.value)}
                      disabled={uploadedFiles.length > 0}
                      min="1"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]/60 transition-colors disabled:opacity-60"
                      placeholder="1048576"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/40 border border-red-700/60 rounded-lg p-3">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-gray-300 bg-[#1a1a1a] border border-[#333] hover:bg-[#222] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-[#f59e0b] text-black hover:bg-[#d97706] px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "Updating..." : "Update JAR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
