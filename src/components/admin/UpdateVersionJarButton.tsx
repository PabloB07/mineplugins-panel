"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
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
        <Icon name="UploadCloud" className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-[#111] rounded-2xl border border-[#222] w-full max-w-2xl shadow-2xl shadow-black/50 overflow-hidden">
              <div className="px-6 py-5 border-b border-[#222] flex items-center justify-between bg-[#0f0f0f]">
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Icon name="UploadCloud" className="w-5 h-5 text-[#f59e0b]" />
                    Update Plugin
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Version <span className="text-gray-300 font-medium">v{versionLabel}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-[#1a1a1a] transition-colors"
                  aria-label="Close"
                >
                  <Icon name="X" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Upload JAR</h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Recommended for most updates. Max size {(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB.
                    </p>
                    <FileUpload
                      accept=".jar"
                      maxSize={MAX_FILE_SIZE}
                      multiple={false}
                      onFilesChange={(files) => setUploadedFiles(files)}
                      label="Upload JAR File"
                      description="Drop your plugin JAR here or click to browse"
                      className="mb-2"
                      inputId={`jar-update-${versionId}`}
                    />
                    {uploadedFiles.length > 0 && (
                      <div className="text-xs text-green-400 mt-2">
                        Selected: {uploadedFiles[0].name}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Use Direct URL</h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Use this if the file is already hosted.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
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
                        <label className="block text-xs font-medium text-gray-400 mb-2">
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
                    {uploadedFiles.length > 0 && (
                      <div className="text-xs text-yellow-400 mt-3">
                        URL fields are disabled while a file is selected.
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-900/40 border border-red-700/60 rounded-lg p-3">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#222]">
                  <div className="text-xs text-gray-500">
                    Tip: Keep version notes updated in the changelog for customers.
                  </div>
                  <div className="flex items-center gap-3">
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
                      <Icon name="Save" className="w-4 h-4" />
                      {isSubmitting ? "Updating..." : "Update JAR"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
