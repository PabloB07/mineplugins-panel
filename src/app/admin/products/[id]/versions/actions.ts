"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/authz";
import { isSafeHttpUrl, toOptionalTrimmedString, toSafeInt } from "@/lib/security";

export async function updateVersionJar(data: {
  versionId: string;
  productId: string;
  downloadUrl: string;
  fileSize: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const versionId = toOptionalTrimmedString(data.versionId, 64);
  const productId = toOptionalTrimmedString(data.productId, 64);
  const downloadUrl = toOptionalTrimmedString(data.downloadUrl, 2048);
  const fileSize = toSafeInt(data.fileSize, {
    defaultValue: 1,
    min: 1,
    max: 1024 * 1024 * 1024,
  });

  if (!versionId || !productId || !downloadUrl) {
    throw new Error("versionId, productId and downloadUrl are required.");
  }

  if (!isSafeHttpUrl(downloadUrl)) {
    throw new Error("downloadUrl must be a valid http(s) URL");
  }

  const existing = await prisma.pluginVersion.findFirst({
    where: {
      id: versionId,
      productId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Version not found for this product.");
  }

  await prisma.pluginVersion.update({
    where: { id: versionId },
    data: {
      downloadUrl,
      fileSize,
    },
  });

  revalidatePath(`/admin/products/${productId}/versions`);
}
