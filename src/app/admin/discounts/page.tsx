"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";

interface DiscountCode {
  id: string;
  code: string;
  type: string;
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

export default function AdminDiscountsPage() {
  const { t } = useTranslation();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "PERCENTAGE",
    value: 0,
    minPurchase: "",
    maxUses: "",
    maxUsesPerUser: "",
    productId: "",
    startsAt: "",
    expiresAt: "",
  });

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discounts");
      const data = await res.json();
      if (data.codes) setCodes(data.codes);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          minPurchase: form.minPurchase ? parseInt(form.minPurchase) : null,
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          maxUsesPerUser: form.maxUsesPerUser ? parseInt(form.maxUsesPerUser) : null,
          productId: form.productId || null,
          startsAt: form.startsAt || null,
          expiresAt: form.expiresAt || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ code: "", type: "PERCENTAGE", value: 0, minPurchase: "", maxUses: "", maxUsesPerUser: "", productId: "", startsAt: "", expiresAt: "" });
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
    if (!confirm("¿Eliminar este código?")) return;
    await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    fetchCodes();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Códigos de Descuento</h1>
        <button onClick={() => setShowModal(true)} className="bg-[#f59e0b] hover:bg-[#d97706] text-black px-4 py-2 rounded-lg font-medium">
          + Crear Código
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400">Cargando...</div>
      ) : (
        <div className="bg-[#111] rounded-xl border border-[#333] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-[#333]">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Código</th>
                <th className="text-left p-4 text-gray-400 font-medium">Tipo</th>
                <th className="text-left p-4 text-gray-400 font-medium">Valor</th>
                <th className="text-left p-4 text-gray-400 font-medium">Usos</th>
                <th className="text-left p-4 text-gray-400 font-medium">Producto</th>
                <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
                <th className="text-left p-4 text-gray-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className="border-b border-[#222] hover:bg-[#1515]">
                  <td className="p-4 text-white font-mono">{code.code}</td>
                  <td className="p-4 text-gray-300">{code.type === "PERCENTAGE" ? "%" : "Fijo"}</td>
                  <td className="p-4 text-gray-300">{code.type === "PERCENTAGE" ? `${code.value}%` : `$${code.value}`}</td>
                  <td className="p-4 text-gray-300">{code.usedCount} / {code.maxUses || "∞"}</td>
                  <td className="p-4 text-gray-300">{code.product?.name || "Todos"}</td>
                  <td className="p-4">
                    <button onClick={() => toggleActive(code.id, code.isActive)} className={`px-2 py-1 rounded text-xs ${code.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {code.isActive ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="p-4">
                    <button onClick={() => deleteCode(code.id)} className="text-red-400 hover:text-red-300 text-sm">Eliminar</button>
                  </td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">No hay códigos de descuento</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111] border border-[#333] rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Crear Código de Descuento</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Código</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Tipo</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white">
                    <option value="PERCENTAGE">Porcentaje</option>
                    <option value="FIXED">Fijo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Valor</label>
                  <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: parseInt(e.target.value) })} className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Máximo usos</label>
                  <input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Usos por usuario</label>
                  <input type="number" value={form.maxUsesPerUser} onChange={(e) => setForm({ ...form, maxUsesPerUser: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Fecha de expiración</label>
                <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-[#222] text-gray-300 py-2 rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-black py-2 rounded-lg font-medium">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
