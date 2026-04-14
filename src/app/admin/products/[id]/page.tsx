import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import ProductImageField from "@/components/admin/ProductImageField";
import MinecraftIconPicker from "@/components/admin/MinecraftIconPicker";

interface PageProps {
  params: Promise<{ id: string }>;
}

type ProductVersionItem = {
  id: string;
  version: string;
  fileSize: number;
  publishedAt: Date;
  isBeta: boolean;
  isLatest: boolean;
  isMandatory: boolean;
  downloadUrl: string;
};

export default async function EditProductPage({ params }: PageProps) {
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

  async function updateProduct(formData: FormData) {
    "use server";

    const productId = formData.get("productId") as string;
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as string;
    const icon = formData.get("icon") as string;
    const priceUSD = parseFloat(formData.get("priceUSD") as string);
    const priceCLP = parseInt(formData.get("priceCLP") as string);
    const salePriceUSD = formData.get("salePriceUSD") ? parseFloat(formData.get("salePriceUSD") as string) : null;
    const salePriceCLP = formData.get("salePriceCLP") ? parseInt(formData.get("salePriceCLP") as string) : null;
    const defaultDurationDays = parseInt(formData.get("defaultDurationDays") as string);
    const maxActivations = parseInt(formData.get("maxActivations") as string);
    const isActive = formData.get("isActive") === "on";

    await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        slug,
        description,
        image: image || null,
        icon: icon || null,
        price: priceCLP, // Legacy field - mirrors CLP price
        salePrice: salePriceCLP, // Legacy field
        priceUSD,
        priceCLP,
        salePriceUSD,
        salePriceCLP,
        defaultDurationDays,
        maxActivations,
        isActive,
      },
    });

    redirect("/admin/products");
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link
              href="/admin/products"
              className="text-gray-400 hover:text-white transition-colors mt-1"
            >
              <Icon name="ArrowLeft" className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Edit Product</h1>
              <p className="text-gray-400 mt-2">Update product information</p>
            </div>
          </div>
        </div>
      </div>

      <form action={updateProduct} className="max-w-2xl">
        <input type="hidden" name="productId" value={id} />
        <div className="bg-[#111] rounded-xl border border-[#222] p-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Icon name="Package" className="w-5 h-5" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  defaultValue={product.name}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]/60 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-2">
                  URL Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  required
                  pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                  title="Only lowercase letters, numbers, and hyphens"
                  defaultValue={product.slug}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]/60 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={product.description || ""}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]/60 transition-colors"
              />
            </div>

            <div className="mt-6">
              <ProductImageField name="image" defaultValue={product.image || ""} />
            </div>

            <div className="mt-6">
              <MinecraftIconPicker name="icon" defaultValue={product.icon || ""} />
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Icon name="DollarSign" className="w-5 h-5" />
              Pricing
            </h2>

            {/* USD Pricing */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">USD Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="priceUSD" className="block text-sm font-medium text-gray-300 mb-2">
                    Regular Price (USD) *
                  </label>
                  <input
                    type="number"
                    id="priceUSD"
                    name="priceUSD"
                    required
                    min="0.01"
                    step="0.01"
                    defaultValue={product.priceUSD}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]/60 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Price in dollars (e.g., 9.99 = $9.99)
                  </p>
                </div>

                <div>
                  <label htmlFor="salePriceUSD" className="block text-sm font-medium text-gray-300 mb-2">
                    Sale Price (USD)
                  </label>
                  <input
                    type="number"
                    id="salePriceUSD"
                    name="salePriceUSD"
                    min="0.01"
                    step="0.01"
                    defaultValue={product.salePriceUSD || ""}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]/60 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional - leave empty if no sale
                  </p>
                </div>
              </div>
            </div>

            {/* CLP Pricing */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">CLP Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="priceCLP" className="block text-sm font-medium text-gray-300 mb-2">
                    Regular Price (CLP) *
                  </label>
                  <input
                    type="number"
                    id="priceCLP"
                    name="priceCLP"
                    required
                    min="1"
                    defaultValue={product.priceCLP}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]/60 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter price in CLP pesos (e.g., 4990)
                  </p>
                </div>

                <div>
                  <label htmlFor="salePriceCLP" className="block text-sm font-medium text-gray-300 mb-2">
                    Sale Price (CLP)
                  </label>
                  <input
                    type="number"
                    id="salePriceCLP"
                    name="salePriceCLP"
                    min="1"
                    defaultValue={product.salePriceCLP || ""}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]/60 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional - leave empty if no sale
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* License Configuration */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Icon name="Server" className="w-5 h-5" />
              License Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="defaultDurationDays" className="block text-sm font-medium text-gray-300 mb-2">
                  Default Duration (days) *
                </label>
                <input
                  type="number"
                  id="defaultDurationDays"
                  name="defaultDurationDays"
                  required
                  min="1"
                  defaultValue={product.defaultDurationDays}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]/60 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="maxActivations" className="block text-sm font-medium text-gray-300 mb-2">
                  Max Activations *
                </label>
                <input
                  type="number"
                  id="maxActivations"
                  name="maxActivations"
                  required
                  min="1"
                  defaultValue={product.maxActivations}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]/60 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Status</h2>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                defaultChecked={product.isActive}
                className="w-4 h-4 text-[#f59e0b] bg-[#0a0a0a] border-[#333] rounded focus:ring-[#f59e0b]/40 focus:ring-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
                Active (visible for purchase)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mb-8">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-[#f59e0b] text-black hover:bg-[#d97706] font-bold py-2.5 px-6 rounded-lg transition-all"
            >
              <Icon name="Save" className="w-4 h-4" />
              Update Product
            </button>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-white font-medium py-2.5 px-6 rounded-lg transition-all border border-[#333]"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>

      {/* Versions Section */}
      <div className="bg-[#111] rounded-xl border border-[#222] p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Icon name="Package" className="w-5 h-5" />
            Plugin Versions ({product.versions.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/products/${id}/versions`}
              className="inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-white font-medium py-2 px-4 rounded-lg transition-all border border-[#333]"
            >
              Manage Versions
            </Link>
            <Link
              href={`/admin/products/${id}/versions/new`}
              className="inline-flex items-center gap-2 bg-[#f59e0b] text-black hover:bg-[#d97706] font-semibold py-2 px-4 rounded-lg transition-all"
            >
              <Icon name="Plus" className="w-4 h-4" />
              Add Version
            </Link>
          </div>
        </div>

        {product.versions.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Package" className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No versions uploaded yet</p>
          </div>
        ) : (
          <div className="bg-[#0a0a0a] rounded-xl border border-[#222] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#111] border-b border-[#222]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Version</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Published</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {product.versions.map((version: ProductVersionItem) => (
                    <tr key={version.id} className="hover:bg-[#151515] transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white font-semibold">v{version.version}</div>
                        <div className="text-sm text-gray-400">
                          {(version.fileSize / 1024 / 1024).toFixed(1)} MB
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {version.isLatest && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs rounded">
                              Latest
                            </span>
                          )}
                          {version.isBeta && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs rounded">
                              Beta
                            </span>
                          )}
                          {version.isMandatory && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-300 border border-red-500/30 text-xs rounded">
                              Required
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">
                          {new Date(version.publishedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={version.downloadUrl}
                            className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
                            title="Download"
                          >
                            <Icon name="Upload" className="w-4 h-4" />
                          </a>
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
    </div>
  );
}
