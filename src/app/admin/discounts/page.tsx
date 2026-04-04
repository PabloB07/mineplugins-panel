"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Percent, Tag, Ticket, TrendingUp } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

interface DiscountCode {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minPurchase: number | null;
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number | null;
  productId: string | null;
  product: { id: string; name: string; slug: string } | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { usages: number; orders: number };
}

const initialForm = {
  code: "",
  type: "PERCENTAGE",
  value: 0,
  minPurchase: "",
  maxUses: "",
  maxUsesPerUser: "",
  productId: "",
  startsAt: "",
  expiresAt: "",
};

export default function AdminDiscountsPage() {
  const { t } = useTranslation();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");

  const filteredCodes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return codes;
    return codes.filter(
      (c) =>
        c.code.toLowerCase().includes(term) ||
        (c.product?.name || "").toLowerCase().includes(term)
    );
  }, [codes, search]);

  const stats = useMemo(() => {
    const total = codes.length;
    const active = codes.filter((c) => c.isActive).length;
    const totalUsages = codes.reduce((acc, c) => acc + c.usedCount, 0);
    const avgValue =
      codes.length === 0
        ? 0
        : Math.round(codes.reduce((acc, c) => acc + c.value, 0) / codes.length);
    return { total, active, totalUsages, avgValue };
  }, [codes]);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discounts");
      const data = await res.json();
      if (data.codes) setCodes(data.codes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          minPurchase: form.minPurchase ? parseInt(form.minPurchase, 10) : null,
          maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
          maxUsesPerUser: form.maxUsesPerUser ? parseInt(form.maxUsesPerUser, 10) : null,
          productId: form.productId || null,
          startsAt: form.startsAt || null,
          expiresAt: form.expiresAt || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm(initialForm);
        fetchCodes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/admin/discounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchCodes();
  };

  const deleteCode = async (id: string) => {
    if (!confirm(t("discountsPage.deleteConfirm"))) return;
    await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    fetchCodes();
  };

  const statCards = [
    {
      key: "total",
      label: t("discountsPage.totalCodes"),
      value: stats.total,
      icon: Ticket,
      accent: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    },
    {
      key: "active",
      label: t("discountsPage.activeCodes"),
      value: stats.active,
      icon: Tag,
      accent: "text-green-400 border-green-500/30 bg-green-500/10",
    },
    {
      key: "usage",
      label: t("discountsPage.totalUses"),
      value: stats.totalUsages,
      icon: TrendingUp,
      accent: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    },
    {
      key: "avg",
      label: t("discountsPage.averageValue"),
      value: stats.avgValue,
      icon: Percent,
      accent: "text-violet-400 border-violet-500/30 bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-[#2f2f2f] bg-gradient-to-br from-[#151515] to-[#0d0d0d] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{t("discountsPage.title")}</h1>
            <p className="mt-1 text-sm text-gray-400">{t("discountsPage.subtitle")}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-[#f59e0b] px-4 py-2 text-sm font-semibold text-black hover:bg-[#d97706]"
          >
            + {t("discountsPage.createCode")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.key} className="rounded-xl border border-[#333] bg-[#111] p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`rounded-lg border p-2 ${card.accent}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#333] bg-[#111] p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("discountsPage.searchPlaceholder")}
          className="w-full rounded-lg border border-[#333] bg-[#0b0b0b] px-3 py-2 text-sm text-white"
        />
      </div>

      {loading ? (
        <div className="text-gray-400">{t("common.loading")}</div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filteredCodes.map((code) => {
            const usageRatio = code.maxUses ? Math.min(100, Math.round((code.usedCount / code.maxUses) * 100)) : 0;
            const isExpired = code.expiresAt ? new Date(code.expiresAt) < new Date() : false;
            return (
              <div key={code.id} className="rounded-xl border border-[#333] bg-[#111] p-4 hover:border-[#f59e0b]/40">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white">{code.code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${code.isActive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                        {code.isActive ? t("discountsPage.active") : t("discountsPage.inactive")}
                      </span>
                      {isExpired ? (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                          {t("discountsPage.expired")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {code.type === "PERCENTAGE"
                        ? `${code.value}% ${t("discountsPage.discountTypePercentage")}`
                        : `${code.value.toLocaleString("es-CL")} CLP ${t("discountsPage.discountTypeFixed")}`}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t("discountsPage.product")}: {code.product?.name || t("discountsPage.allProducts")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(code.id, code.isActive)}
                      className="rounded-lg border border-[#444] bg-[#0f0f0f] px-2.5 py-1 text-xs text-gray-200 hover:border-[#777]"
                    >
                      {code.isActive ? t("discountsPage.deactivate") : t("discountsPage.activate")}
                    </button>
                    <button
                      onClick={() => deleteCode(code.id)}
                      className="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs text-red-300"
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                    <span>{t("discountsPage.usage")}</span>
                    <span>
                      {code.usedCount} / {code.maxUses ?? "∞"}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#222]">
                    <div className="h-2 rounded-full bg-[#f59e0b]" style={{ width: `${usageRatio}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
          {!loading && filteredCodes.length === 0 ? (
            <div className="rounded-xl border border-[#333] bg-[#111] p-8 text-center text-gray-500 xl:col-span-2">
              {t("discountsPage.empty")}
            </div>
          ) : null}
        </div>
      )}

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#333] bg-[#111] p-6">
            <h2 className="text-xl font-bold text-white">{t("discountsPage.createTitle")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("discountsPage.createSubtitle")}</p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-gray-300">
                  {t("discountsPage.code")}
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-white"
                    required
                  />
                </label>
                <label className="text-sm text-gray-300">
                  {t("discountsPage.value")}
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: parseInt(e.target.value || "0", 10) })}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-white"
                    required
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-gray-300">
                  {t("discountsPage.type")}
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-white"
                  >
                    <option value="PERCENTAGE">{t("discountsPage.discountTypePercentage")}</option>
                    <option value="FIXED">{t("discountsPage.discountTypeFixed")}</option>
                  </select>
                </label>
                <label className="text-sm text-gray-300">
                  {t("discountsPage.productId")}
                  <input
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-white"
                    placeholder={t("discountsPage.productIdPlaceholder")}
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-sm text-gray-300">
                  {t("discountsPage.maxUses")}
                  <input
                    type="number"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  {t("discountsPage.maxUsesPerUser")}
                  <input
                    type="number"
                    value={form.maxUsesPerUser}
                    onChange={(e) => setForm({ ...form, maxUsesPerUser: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  {t("discountsPage.minPurchase")}
                  <input
                    type="number"
                    value={form.minPurchase}
                    onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-white"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-gray-300">
                  {t("discountsPage.startsAt")}
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  {t("discountsPage.expiresAt")}
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-white"
                  />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-[#333] bg-[#1a1a1a] py-2 text-sm text-gray-300"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-[#f59e0b] py-2 text-sm font-semibold text-black hover:bg-[#d97706]"
                >
                  {t("discountsPage.createCode")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
