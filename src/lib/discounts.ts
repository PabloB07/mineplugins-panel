import { Prisma } from "@prisma/client";

export async function registerDiscountUsageOnCompletedOrder(
  tx: Prisma.TransactionClient,
  orderId: string
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      discountCodeId: true,
      discount: true,
      discountCLP: true,
    },
  });

  if (!order?.discountCodeId) return;

  const existingUsage = await tx.discountUsage.findUnique({
    where: { orderId: order.id },
    select: { id: true },
  });

  if (existingUsage) return;

  const discountAmount = Math.max(
    0,
    order.discount > 0 ? order.discount : Math.round(order.discountCLP || 0)
  );

  await tx.discountUsage.create({
    data: {
      discountCodeId: order.discountCodeId,
      userId: order.userId,
      orderId: order.id,
      discountAmount,
    },
  });

  await tx.discountCode.update({
    where: { id: order.discountCodeId },
    data: {
      usedCount: {
        increment: 1,
      },
    },
  });
}
