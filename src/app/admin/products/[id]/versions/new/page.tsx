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
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link
              href={`/admin/products/${id}/versions`}
              className="text-gray-400 hover:text-white transition-colors mt-1"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Add Version</h1>
              <p className="text-gray-400 mt-2">{product.name}</p>
            </div>
          </div>
        </div>
      </div>

      <VersionForm productId={id} />
    </div>
  );
}
