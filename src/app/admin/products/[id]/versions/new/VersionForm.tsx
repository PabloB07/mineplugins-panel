"use client";

import { useState } from "react";
import { Save, Package } from "lucide-react";
import FileUpload from "@/components/ui/FileUpload";
import { handleFileUpload } from "@/lib/file-actions";
import { createVersion } from "./actions";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
import Link from "next/link";

interface VersionFormProps {
  productId: string;
}

export default function VersionForm({ productId }: VersionFormProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    
    try {
      const version = formData.get("version") as string;
      const changelog = formData.get("changelog") as string;
      const minJavaVersion = formData.get("minJavaVersion") as string || null;
      const minMcVersion = formData.get("minMcVersion") as string || null;
      const isBeta = formData.get("isBeta") === "on";
      const isLatest = formData.get("isLatest") === "on";
      const isMandatory = formData.get("isMandatory") === "on";

      // Handle file upload
      let downloadUrl = formData.get("downloadUrl") as string;
      let fileSize = parseInt(formData.get("fileSize") as string) || 0;

      if (uploadedFiles.length > 0) {
        const file = uploadedFiles[0];
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        
        try {
          const uploadResult = await handleFileUpload(uploadFormData);
          downloadUrl = uploadResult.url;
          fileSize = uploadResult.size;
          console.log(`File uploaded: ${uploadResult.name} -> ${uploadResult.url}`);
        } catch (uploadError) {
          throw new Error(`File upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      // Call server action
      await createVersion({
        productId,
        version,
        changelog,
        downloadUrl,
        fileSize,
        minJavaVersion,
        minMcVersion,
        isBeta,
        isLatest,
        isMandatory,
      });

      window.location.href = `/admin/products/${productId}/versions`;
    } catch (error) {
      console.error("Error creating version:", error);
      alert(error instanceof Error ? error.message : "Failed to create version");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="max-w-2xl">
      <input type="hidden" name="productId" value={productId} />
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        {/* Version Info */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Version Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="version" className="block text-sm font-medium text-gray-300 mb-2">
                Version Number *
              </label>
              <input
                type="text"
                id="version"
                name="version"
                required
                pattern="[0-9]+\.[0-9]+\.[0-9]+"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1.0.0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Semantic version (e.g., 1.0.0, 2.1.3)
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Plugin File *
            </label>
            <FileUpload
              accept=".jar"
              maxSize={MAX_FILE_SIZE}
              multiple={false}
              onFilesChange={(files) => setUploadedFiles(files)}
              label="Upload JAR File"
              description="Drop your plugin JAR file here or click to browse"
              className="mb-4"
            />
          </div>

          {/* Fallback URL input */}
          {uploadedFiles.length === 0 && (
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="downloadUrl" className="block text-sm font-medium text-gray-300 mb-2">
                  Download URL *
                </label>
                <input
                  type="url"
                  id="downloadUrl"
                  name="downloadUrl"
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://storage.example.com/plugin-1.0.0.jar"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Direct download link to JAR file
                </p>
              </div>

              <div>
                <label htmlFor="fileSize" className="block text-sm font-medium text-gray-300 mb-2">
                  File Size (bytes) *
                </label>
                <input
                  type="number"
                  id="fileSize"
                  name="fileSize"
                  required
                  min="1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1048576"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Size in bytes (1 MB = 1048576)
                </p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label htmlFor="changelog" className="block text-sm font-medium text-gray-300 mb-2">
              Changelog
            </label>
            <textarea
              id="changelog"
              name="changelog"
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="- Added new features&#10;- Fixed bugs&#10;- Improved performance"
            />
          </div>
        </div>

        {/* Compatibility */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Compatibility</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="minMcVersion" className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Minecraft Version
              </label>
              <input
                type="text"
                id="minMcVersion"
                name="minMcVersion"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1.21.3"
              />
            </div>

            <div>
              <label htmlFor="minJavaVersion" className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Java Version
              </label>
              <input
                type="text"
                id="minJavaVersion"
                name="minJavaVersion"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="21"
              />
            </div>
          </div>
        </div>

        {/* Flags */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Version Flags</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isLatest"
                name="isLatest"
                defaultChecked
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="isLatest" className="text-sm font-medium text-gray-300">
                Mark as Latest Version
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isBeta"
                name="isBeta"
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="isBeta" className="text-sm font-medium text-gray-300">
                Beta Version (not recommended for production)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isMandatory"
                name="isMandatory"
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="isMandatory" className="text-sm font-medium text-gray-300">
                Mandatory Update (force users to update)
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-all"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Creating..." : "Create Version"}
          </button>
          <Link
            href={`/admin/products/${productId}/versions`}
            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-all"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}