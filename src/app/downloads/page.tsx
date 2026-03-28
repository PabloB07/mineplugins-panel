import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DownloadsContent from "./DownloadsContent";

export default async function DownloadsPage() {
  const session = await getServerSession(authOptions);
  
  const licenses = session?.user?.id ? await prisma.license.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          versions: {
            orderBy: { publishedAt: "desc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  }) : [];

  const userSession = session ? { user: { ...session.user, name: session.user?.name ?? null, email: session.user?.email ?? null, image: session.user?.image ?? null } } : null;
  return <DownloadsContent session={userSession} licenses={licenses} />;
}
