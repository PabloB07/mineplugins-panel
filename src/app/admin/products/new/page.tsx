"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Package, DollarSign, Server } from "lucide-react";
import ProductImageField from "@/components/admin/ProductImageField";
import { useTranslation } from "@/i18n/useTranslation";

export default function NewProductPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (autoGenerate && name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setSlug(generatedSlug);
    }
  }, [name, autoGenerate]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (autoGenerate && newName) {
      const generatedSlug = newName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        router.push("/admin/products");
      } else {
        const error = await response.json();
        alert(error.message || "Error creating product");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
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
                {t("admin.backToProducts")}
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
              {t("admin.newProductTitle")}
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              {t("admin.newProductDesc")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-sm">
                <Package className="w-4 h-4 mr-2" />
                {t("admin.productCreation")}
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <DollarSign className="w-4 h-4 mr-2" />
                {t("admin.pricingSetup")}
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                <Server className="w-4 h-4 mr-2" />
                {t("admin.serverManagement")}
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

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden hover:border-[#f59e0b]/20 transition-all duration-300">
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b] border border-[#f59e0b]/20">
                  <Package className="w-4 h-4" />
                </div>
                {t("admin.basicInfo")}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    {t("admin.productName")} *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={name}
                    onChange={handleNameChange}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
                    placeholder="Paper Essentials"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-300">
                      {t("admin.urlSlug")} *
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoGenerate}
                        onChange={(e) => setAutoGenerate(e.target.checked)}
                        className="rounded border-[#333] bg-[#0a0a0a] text-[#f59e0b] focus:ring-[#f59e0b]"
                      />
                      {t("admin.auto")}
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">/</div>
                    <input
                      type="text"
                      id="slug"
                      name="slug"
                      required
                      pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                      title="Only lowercase letters, numbers, and hyphens"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-"));
                        setAutoGenerate(false);
                      }}
                      className="w-full px-3 py-2 pl-7 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
                      placeholder="paper-essentials"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("admin.lowerCaseOnly")}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  {t("admin.description")}
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
                  placeholder={t("admin.descriptionPlaceholder")}
                />
              </div>

              <div className="mt-6">
                <ProductImageField name="image" defaultValue="" />
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
                {t("admin.pricing")}
              </h2>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3">{t("admin.usdPricing")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="priceUSD" className="block text-sm font-medium text-gray-300 mb-2">
                      {t("admin.regularPriceUsd")}
                    </label>
                    <input
                      type="number"
                      id="priceUSD"
                      name="priceUSD"
                      required
                      min="0.01"
                      step="0.01"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
                      placeholder="9.99"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t("admin.regularPriceUsdHelp")}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="salePriceUSD" className="block text-sm font-medium text-gray-300 mb-2">
                      {t("admin.salePriceUsd")}
                    </label>
                    <input
                      type="number"
                      id="salePriceUSD"
                      name="salePriceUSD"
                      min="0.01"
                      step="0.01"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
                      placeholder="4.99"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t("admin.salePriceHelp")}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">{t("admin.clpPricing")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="priceCLP" className="block text-sm font-medium text-gray-300 mb-2">
                      {t("admin.regularPriceClp")}
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
                      {t("admin.regularPriceClpHelp")}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="salePriceCLP" className="block text-sm font-medium text-gray-300 mb-2">
                      {t("admin.salePriceClp")}
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

            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e] border border-[#22c55e]/20">
                  <Server className="w-4 h-4" />
                </div>
                {t("admin.licenseConfig")}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="defaultDurationDays" className="block text-sm font-medium text-gray-300 mb-2">
                    {t("admin.defaultDurationDays")}
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
                    {t("admin.maxActivationsLabel")}
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

            <div>
              <h2 className="text-xl font-bold text-white mb-6">{t("admin.productStatus")}</h2>
              
              <div className="bg-[#0a0a0a]/50 rounded-lg p-6 border border-[#222]">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    defaultChecked={true}
                    className="w-5 h-5 rounded bg-[#222] border-[#333] text-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
                  />
                  <span className="text-white font-medium">{t("admin.productIsActive")}</span>
                </label>
                <p className="text-gray-400 text-sm mt-2">
                  {t("admin.productActiveHelp")}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <Link
                href="/admin/products"
                className="bg-[#222] hover:bg-[#333] text-gray-300 hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
              >
                {t("common.cancel")}
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#f59e0b] text-black hover:bg-[#d97706] px-8 py-3 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-[#f59e0b]/20 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? t("common.processing") : t("admin.createProductBtn")}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
