"use server";

import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/authz";
import {
  getRequiredEnv,
  sanitizeJarFilename,
} from "@/lib/security";

export async function handleFileUpload(formData: FormData): Promise<{ url: string; size: number; name: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;

  if (!file) {
    throw new Error("No file provided");
  }

  const safeFileName = sanitizeJarFilename(file.name);

  // Validate file type
  if (!safeFileName.toLowerCase().endsWith(".jar")) {
    throw new Error("Only JAR files are allowed");
  }

  // Validate file size (50MB max)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  // Check for blob token
  const blobToken = getRequiredEnv("BLOB_READ_WRITE_TOKEN");

  try {
    // Upload file to Vercel Blob
    const blob = await put(`plugins/${safeFileName}`, file, {
      access: "public",
      addRandomSuffix: true,
      token: blobToken,
    });

    console.log(`File uploaded successfully: ${safeFileName} -> ${blob.url} (${file.size} bytes)`);

    return {
      url: blob.url,
      size: file.size,
      name: safeFileName,
    };
  } catch (uploadError) {
    console.error("Vercel Blob upload error:", uploadError);
    throw new Error(
      `Failed to upload file to Vercel Blob: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`
    );
  }
}
