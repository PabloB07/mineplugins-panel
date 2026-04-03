import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import CheckoutWrapper from "./CheckoutContent";

interface PageProps {
  searchParams: Promise<{ productId?: string }>;
}

interface SerializedProduct {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  priceUSD: number;
  priceCLP: number;
  salePriceUSD: number | null;
  salePriceCLP: number | null;
  defaultDurationDays: number;
  maxActivations: number;
  versions: Array<{
    version: string;
    minMcVersion: string | null;
    minJavaVersion: string | null;
  }>;
  session: {
    name: string | null;
    email: string;
    role: string;
  };
}

export default async function CheckoutPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/store");
  }

  const { productId } = await searchParams;

  if (!productId) {
    redirect("/store");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    include: {
      versions: {
        where: { isLatest: true },
        select: { version: true, minMcVersion: true, minJavaVersion: true },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const serializedProduct: SerializedProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    image: product.image,
    icon: product.icon,
    priceUSD: product.priceUSD,
    priceCLP: product.priceCLP,
    salePriceUSD: product.salePriceUSD,
    salePriceCLP: product.salePriceCLP,
    defaultDurationDays: product.defaultDurationDays,
    maxActivations: product.maxActivations,
    versions: product.versions.map((v) => ({
      version: v.version,
      minMcVersion: v.minMcVersion,
      minJavaVersion: v.minJavaVersion,
    })),
    session: {
      name: session.user.name ?? null,
      email: session.user.email,
      role: session.user.role || "CUSTOMER",
    },
  };

  return <CheckoutWrapper product={serializedProduct} />;
}