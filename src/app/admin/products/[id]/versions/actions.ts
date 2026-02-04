"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateVersionJar(data: {
  versionId: string;
  productId: string;
  downloadUrl: string;
  fileSize: number;
}) {
  const existing = await prisma.pluginVersion.findFirst({
    where: {
      id: data.versionId,
      productId: data.productId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Version not found for this product.");
  }

  await prisma.pluginVersion.update({
    where: { id: data.versionId },
    data: {
      downloadUrl: data.downloadUrl,
      fileSize: Math.max(1, Math.floor(data.fileSize)),
    },
  });

  revalidatePath(`/admin/products/${data.productId}/versions`);
}
