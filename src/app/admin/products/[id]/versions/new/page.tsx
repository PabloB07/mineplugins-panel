import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import VersionForm from "./VersionForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewVersionPage({ params }: PageProps) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href={`/admin/products/${id}/versions`}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Add Version</h1>
          <p className="text-gray-400 mt-1">{product.name}</p>
        </div>
      </div>

      <VersionForm productId={id} />
    </div>
  );
}