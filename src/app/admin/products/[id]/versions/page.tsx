import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Plus, Package, Download, Star, AlertTriangle } from "lucide-react";
import { revalidatePath } from "next/cache";
import { DeleteVersionButton } from "@/components/DeleteVersionButton";
import { UpdateVersionJarButton } from "@/components/admin/UpdateVersionJarButton";
import en from "@/messages/en.json";

const messages = en;

function getMessage(key: string): string {
  const keys = key.split(".");
  let result: unknown = messages;
  for (const k of keys) {
    if (result && typeof result === "object" && k in (result as object)) {
      result = (result as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  return typeof result === "string" ? result : key;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

type PluginVersionItem = {
  id: string;
  version: string;
  fileSize: number;
  minMcVersion: string | null;
  minJavaVersion: string | null;
  changelog: string | null;
  isLatest: boolean;
  isBeta: boolean;
  isMandatory: boolean;
  publishedAt: Date;
  downloadUrl: string;
};

async function deleteVersion(versionId: string, productId: string) {
  "use server";
  await prisma.pluginVersion.delete({ where: { id: versionId } });
  revalidatePath(`/admin/products/${productId}/versions`);
}

async function setLatestVersion(versionId: string, productId: string) {
  "use server";
  // First, unset all versions as latest
  await prisma.pluginVersion.updateMany({
    where: { productId },
    data: { isLatest: false },
  });
  // Set the selected version as latest
  await prisma.pluginVersion.update({
    where: { id: versionId },
    data: { isLatest: true },
  });
  revalidatePath(`/admin/products/${productId}/versions`);
}

export default async function ProductVersionsPage({ params }: PageProps) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { publishedAt: "desc" },
      },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link
              href={`/admin/products/${id}`}
              className="text-gray-400 hover:text-white transition-colors mt-1"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Versions</h1>
              <p className="text-gray-400 mt-2">{product.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/products/${id}/versions/new`}
              className="inline-flex items-center gap-2 bg-[#f59e0b] text-black hover:bg-[#d97706] px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 shadow-lg shadow-[#f59e0b]/20"
            >
              <Plus className="w-5 h-5" />
              Add Version
            </Link>
          </div>
        </div>
      </div>

      {product.versions.length === 0 ? (
        <div className="relative bg-[#111] rounded-xl border border-[#222] p-16 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f59e0b]/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-[#0a0a0a] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#222]">
              <Package className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No Versions Yet</h3>
            <p className="text-gray-400 mb-6 text-lg">Upload your first plugin version.</p>
            <Link
              href={`/admin/products/${id}/versions/new`}
              className="inline-flex items-center gap-2 bg-[#f59e0b] text-black hover:bg-[#d97706] font-bold py-3 px-6 rounded-xl transition-transform hover:scale-105 shadow-lg shadow-[#f59e0b]/20"
            >
              <Plus className="w-5 h-5" />
              Add Version
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden hover:border-[#f59e0b]/20 transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] border-b border-[#222]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Version</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Published</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {product.versions.map((version: PluginVersionItem) => (
                  <tr key={version.id} className="hover:bg-[#151515] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-white font-bold text-lg group-hover:text-[#f59e0b] transition-colors">
                        v{version.version}
                      </div>
                      <div className="text-sm text-gray-400">
                        {(version.fileSize / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {version.minMcVersion && (
                          <div>MC: {version.minMcVersion}+</div>
                        )}
                        {version.minJavaVersion && (
                          <div>{getMessage("admin.java")}: {version.minJavaVersion}+</div>
                        )}
                      </div>
                      {version.changelog && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {version.changelog}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {version.isLatest && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs rounded">
                            <Star className="w-3 h-3" />
                            Latest
                          </span>
                        )}
                        {version.isBeta && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs rounded">
                            Beta
                          </span>
                        )}
                        {version.isMandatory && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-300 border border-red-500/30 text-xs rounded">
                            <AlertTriangle className="w-3 h-3" />
                            Required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {new Date(version.publishedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(version.publishedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={version.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <UpdateVersionJarButton
                          versionId={version.id}
                          productId={id}
                          versionLabel={version.version}
                        />
                        {!version.isLatest && (
                          <form
                            action={async () => {
                              "use server";
                              await setLatestVersion(version.id, id);
                            }}
                          >
                            <button
                              type="submit"
                              className="text-yellow-400 hover:text-yellow-300 p-2 hover:bg-yellow-500/10 rounded-lg transition-colors border border-transparent hover:border-yellow-500/20"
                              title="Set as Latest"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          </form>
                        )}
                        <DeleteVersionButton
                          versionId={version.id}
                          productId={id}
                          deleteAction={deleteVersion}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
