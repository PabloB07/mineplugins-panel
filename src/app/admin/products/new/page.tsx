import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Save, Package, DollarSign, Calendar, Server } from "lucide-react";

export default async function NewProductPage() {
  async function createProduct(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const priceUSD = parseInt(formData.get("priceUSD") as string);
    const priceCLP = parseInt(formData.get("priceCLP") as string);
    const salePriceUSD = formData.get("salePriceUSD") ? parseInt(formData.get("salePriceUSD") as string) : null;
    const salePriceCLP = formData.get("salePriceCLP") ? parseInt(formData.get("salePriceCLP") as string) : null;
    const defaultDurationDays = parseInt(formData.get("defaultDurationDays") as string);
    const maxActivations = parseInt(formData.get("maxActivations") as string);
    const isActive = formData.get("isActive") === "on";

    // Check if slug already exists
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      throw new Error(`A product with slug "${slug}" already exists. Please use a different slug.`);
    }

    await prisma.product.create({
      data: {
        name,
        slug,
        description,
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
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin/products"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">New Product</h1>
          <p className="text-gray-400 mt-1">Create a new plugin product</p>
        </div>
      </div>

      <form action={createProduct} className="max-w-2xl">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Package className="w-5 h-5" />
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="TownyFaiths Premium"
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
                  pattern="[a-z0-9-]+"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="townyfaiths-premium"
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your plugin product..."
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing
            </h2>

            {/* USD Pricing */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">USD Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="priceUSD" className="block text-sm font-medium text-gray-300 mb-2">
                    Regular Price (USD cents) *
                  </label>
                  <input
                    type="number"
                    id="priceUSD"
                    name="priceUSD"
                    required
                    min="1"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="999"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter price in cents (e.g., 999 = $9.99)
                  </p>
                </div>

                <div>
                  <label htmlFor="salePriceUSD" className="block text-sm font-medium text-gray-300 mb-2">
                    Sale Price (USD cents)
                  </label>
                  <input
                    type="number"
                    id="salePriceUSD"
                    name="salePriceUSD"
                    min="1"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="499"
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
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="4990"
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
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2990"
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
              <Server className="w-5 h-5" />
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
                  defaultValue="365"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  defaultValue="1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                defaultChecked
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
                Active (visible for purchase)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-medium py-2 px-6 rounded-lg transition-all"
            >
              <Save className="w-4 h-4" />
              Create Product
            </button>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-all"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}