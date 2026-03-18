import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/ui/Header";
import StoreContent from "@/components/store/StoreContent";

export default async function BuyPage() {
  const session = await getServerSession(authOptions);

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      versions: {
        where: { isLatest: true },
        select: { version: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <div className="relative overflow-hidden pt-24 pb-20 lg:pt-32 lg:pb-28">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <StoreContent products={products} session={session} />
      </div>
    </div>
  );
}
