"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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

  // Create unique filename with timestamp
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const fileExtension = file.name.split('.').pop() || '';
  const uniqueFilename = `${timestamp}-${random}.${fileExtension}`;
  
  // Create upload directory if it doesn't exist
  const uploadDir = join(process.cwd(), "public", "plugins");
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    // Directory already exists, continue
    console.log("Upload directory already exists");
  }
  
  // Create full file path
  const filePath = join(uploadDir, uniqueFilename);
  
  try {
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);
    
    // Return relative URL from public directory
    const url = `/plugins/${uniqueFilename}`;
    
    console.log(`File uploaded successfully: ${file.name} -> ${url} (${file.size} bytes)`);
    
    return {
      url,
      size: file.size,
      name: file.name
    };
  } catch (writeError) {
    console.error("File write error:", writeError);
    throw new Error("Failed to save file");
  }
}