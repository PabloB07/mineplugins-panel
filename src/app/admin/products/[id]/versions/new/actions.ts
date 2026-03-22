"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/authz";
import { isSafeHttpUrl, toOptionalTrimmedString, toSafeInt } from "@/lib/security";

export async function createVersion(data: {
  productId: string;
  version: string;
  changelog?: string;
  downloadUrl: string;
  fileName?: string | null;
  fileSize: number;
  minJavaVersion?: string | null;
  minMcVersion?: string | null;
  isBeta: boolean;
  isLatest: boolean;
  isMandatory: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const productId = toOptionalTrimmedString(data.productId, 64);
  const version = toOptionalTrimmedString(data.version, 64);
  const downloadUrl = toOptionalTrimmedString(data.downloadUrl, 2048);
  const fileSize = toSafeInt(data.fileSize, {
    defaultValue: 1,
    min: 1,
    max: 1024 * 1024 * 1024,
  });

  if (!productId || !version || !downloadUrl) {
    throw new Error("productId, version, and downloadUrl are required");
  }

  if (!isSafeHttpUrl(downloadUrl)) {
    throw new Error("downloadUrl must be a valid http(s) URL");
  }

  // Check if version already exists for this product
  const existing = await prisma.pluginVersion.findUnique({
    where: {
      productId_version: {
        productId,
        version,
      },
    },
  });

  if (existing) {
    throw new Error(`Version ${version} already exists for this product.`);
  }

  // If this version is set as latest, unset others
  if (data.isLatest) {
    await prisma.pluginVersion.updateMany({
      where: { productId },
      data: { isLatest: false },
    });
  }

  await prisma.pluginVersion.create({
    data: {
      productId,
      version,
      changelog: toOptionalTrimmedString(data.changelog, 8000) || null,
      downloadUrl,
      fileName: toOptionalTrimmedString(data.fileName, 255) || null,
      fileSize,
      minJavaVersion: toOptionalTrimmedString(data.minJavaVersion, 32) || null,
      minMcVersion: toOptionalTrimmedString(data.minMcVersion, 32) || null,
      isBeta: data.isBeta,
      isLatest: data.isLatest,
      isMandatory: data.isMandatory,
    },
  });
}
