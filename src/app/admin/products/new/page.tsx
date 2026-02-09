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
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Hero - Gradient Background */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/admin/products"
                className="text-gray-400 hover:text-[#f59e0b] transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Products
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
              New Product
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              Create a new product for the MinePlugins store. Set pricing, availability, and features.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-sm">
                <Package className="w-4 h-4 mr-2" />
                Product Creation
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <DollarSign className="w-4 h-4 mr-2" />
                Pricing Setup
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                <Server className="w-4 h-4 mr-2" />
                Server Management
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="w-12 h-12 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b] border border-[#f59e0b]/20 hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <form action={createProduct} className="max-w-2xl">
        <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden hover:border-[#f59e0b]/20 transition-all duration-300">
          <div className="p-6">
            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b] border border-[#f59e0b]/20">
                  <Package className="w-4 h-4" />
                </div>
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
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
                    placeholder="Paper Essentials"
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
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
                    placeholder="paper-essentials"
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
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
                  placeholder="Describe your plugin product..."
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
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
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
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
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
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
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
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
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
                      placeholder="2990"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* License Configuration */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e] border border-[#22c55e]/20">
                  <Server className="w-4 h-4" />
                </div>
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
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
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
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Product Status */}
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Product Status</h2>
              
              <div className="bg-[#0a0a0a]/50 rounded-lg p-6 border border-[#222]">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    defaultChecked={true}
                    className="w-5 h-5 rounded bg-[#222] border-[#333] text-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
                  />
                  <span className="text-white font-medium">Product is Active</span>
                </label>
                <p className="text-gray-400 text-sm mt-2">
                  When active, the product will be available for purchase and download
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 mt-8">
              <Link
                href="/admin/products"
                className="bg-[#222] hover:bg-[#333] text-gray-300 hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="bg-[#f59e0b] text-black hover:bg-[#d97706] px-8 py-3 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-[#f59e0b]/20 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Create Product
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
