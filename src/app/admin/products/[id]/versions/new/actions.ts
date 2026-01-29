"use server";

import { prisma } from "@/lib/prisma";

export async function createVersion(data: {
  productId: string;
  version: string;
  changelog?: string;
  downloadUrl: string;
  fileSize: number;
  minJavaVersion?: string | null;
  minMcVersion?: string | null;
  isBeta: boolean;
  isLatest: boolean;
  isMandatory: boolean;
}) {
  // Check if version already exists for this product
  const existing = await prisma.pluginVersion.findUnique({
    where: { 
      productId_version: { 
        productId: data.productId, 
        version: data.version 
      } 
    },
  });

  if (existing) {
    throw new Error(`Version ${data.version} already exists for this product.`);
  }

  // If this version is set as latest, unset others
  if (data.isLatest) {
    await prisma.pluginVersion.updateMany({
      where: { productId: data.productId },
      data: { isLatest: false },
    });
  }

  await prisma.pluginVersion.create({
    data: {
      productId: data.productId,
      version: data.version,
      changelog: data.changelog || null,
      downloadUrl: data.downloadUrl,
      fileSize: data.fileSize,
      minJavaVersion: data.minJavaVersion,
      minMcVersion: data.minMcVersion,
      isBeta: data.isBeta,
      isLatest: data.isLatest,
      isMandatory: data.isMandatory,
    },
  });
}