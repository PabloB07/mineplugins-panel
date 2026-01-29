"use server";

import { put } from '@vercel/blob';

export async function handleFileUpload(formData: FormData): Promise<{ url: string; size: number; name: string }> {
  const file = formData.get("file") as File;
  
  if (!file) {
    throw new Error("No file provided");
  }

  // Validate file type
  if (!file.name.toLowerCase().endsWith('.jar')) {
    throw new Error("Only JAR files are allowed");
  }

  // Validate file size (50MB max)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  // Check for blob token
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken || blobToken === "your-blob-token-here") {
    throw new Error("Vercel Blob token not configured. Please set BLOB_READ_WRITE_TOKEN in your environment variables.");
  }

  try {
    // Upload file to Vercel Blob
    const blob = await put(`plugins/${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
      token: blobToken,
    });
    
    console.log(`File uploaded successfully: ${file.name} -> ${blob.url} (${file.size} bytes)`);
    
    return {
      url: blob.url,
      size: file.size,
      name: file.name
    };
  } catch (uploadError) {
    console.error("Vercel Blob upload error:", uploadError);
    throw new Error(`Failed to upload file to Vercel Blob: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
  }
}