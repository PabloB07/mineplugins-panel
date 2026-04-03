import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OrdersContent from "./OrdersContent";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  
  const orders = session?.user?.id ? await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, icon: true },
          },
          license: {
            select: { 
              id: true, 
              status: true, 
              expiresAt: true,
              licenseKey: true 
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  }) : [];

  const userSession = session ? { user: { ...session.user, name: session.user?.name ?? null, email: session.user?.email ?? null, image: session.user?.image ?? null } } : null;
  return <OrdersContent session={userSession} orders={orders} />;
}
