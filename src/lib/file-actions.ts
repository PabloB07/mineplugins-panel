"use server";

import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/authz";
import {
  getRequiredEnv,
  sanitizeJarFilename,
} from "@/lib/security";

export async function handleFileUpload(formData: FormData): Promise<{ url: string; size: number; name: string }> {
  const session = await auth();
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
  const blobToken = getRequiredEnv("BLOB_READ_WRITE_TOKEN", { allowEmptyInDev: true });

  try {
    const blobFileName = safeFileName;
    
    const blob = await put(`plugins/${blobFileName}`, file, {
      access: "public",
      addRandomSuffix: false,
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

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export async function handleImageUpload(formData: FormData): Promise<{ url: string; size: number; name: string }> {
  const session = await auth();
  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;

  if (!file) {
    throw new Error("No file provided");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image size must be less than ${Math.round(MAX_IMAGE_SIZE / 1024 / 1024)}MB`);
  }

  const blobToken = getRequiredEnv("BLOB_READ_WRITE_TOKEN", { allowEmptyInDev: true });
  const extension = file.name.split(".").pop() || "png";

  try {
    const blob = await put(`products/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`, file, {
      access: "public",
      addRandomSuffix: false,
      token: blobToken,
    });

    return {
      url: blob.url,
      size: file.size,
      name: file.name,
    };
  } catch (uploadError) {
    console.error("Vercel Blob image upload error:", uploadError);
    throw new Error(
      `Failed to upload image to Vercel Blob: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`
    );
  }
}

export async function handleTicketAttachmentUpload(formData: FormData): Promise<{ url: string; size: number; name: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;

  if (!file) {
    throw new Error("No file provided");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image size must be less than ${Math.round(MAX_IMAGE_SIZE / 1024 / 1024)}MB`);
  }

  const blobToken = getRequiredEnv("BLOB_READ_WRITE_TOKEN", { allowEmptyInDev: true });
  const extension = file.name.split(".").pop() || "png";

  try {
    const blob = await put(`tickets/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`, file, {
      access: "public",
      addRandomSuffix: false,
      token: blobToken,
    });

    return {
      url: blob.url,
      size: file.size,
      name: file.name,
    };
  } catch (uploadError) {
    console.error("Vercel Blob attachment upload error:", uploadError);
    throw new Error(
      `Failed to upload attachment to Vercel Blob: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`
    );
  }
}
