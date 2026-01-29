import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Plus, Package, Download, Trash2, Star, AlertTriangle } from "lucide-react";
import { revalidatePath } from "next/cache";
import { DeleteVersionButton } from "@/components/DeleteVersionButton";

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
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/products/${id}`}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Versions</h1>
            <p className="text-gray-400 mt-1">{product.name}</p>
          </div>
        </div>
        <Link
          href={`/admin/products/${id}/versions/new`}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-medium py-2 px-4 rounded-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Version
        </Link>
      </div>

      {product.versions.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Versions Yet</h3>
          <p className="text-gray-400 mb-4">Upload your first plugin version.</p>
          <Link
            href={`/admin/products/${id}/versions/new`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Version
          </Link>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50 border-b border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Version</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Details</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Published</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {product.versions.map((version: PluginVersionItem) => (
                  <tr key={version.id} className="hover:bg-gray-700/30">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium text-lg">v{version.version}</div>
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
                          <div>Java: {version.minJavaVersion}+</div>
                        )}
                      </div>
                      {version.changelog && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {version.changelog}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {version.isLatest && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded">
                            <Star className="w-3 h-3" />
                            Latest
                          </span>
                        )}
                        {version.isBeta && (
                          <span className="px-2 py-1 bg-yellow-900 text-yellow-300 text-xs rounded">
                            Beta
                          </span>
                        )}
                        {version.isMandatory && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-900 text-red-300 text-xs rounded">
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
                          className="text-blue-400 hover:text-blue-300 p-1 hover:bg-gray-600/50 rounded transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {!version.isLatest && (
                          <form
                            action={async () => {
                              "use server";
                              await setLatestVersion(version.id, id);
                            }}
                          >
                            <button
                              type="submit"
                              className="text-yellow-400 hover:text-yellow-300 p-1 hover:bg-gray-600/50 rounded transition-colors"
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
