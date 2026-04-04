"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  _count: { messages: number };
}

export default function DashboardTicketsPage() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "GENERAL",
    priority: "MEDIUM",
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const createTicket = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({
          subject: "",
          description: "",
          category: "GENERAL",
          priority: "MEDIUM",
        });
        await fetchTickets();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("tickets.title")}</h1>
        <p className="text-sm text-gray-400">{t("tickets.subtitle")}</p>
      </div>

      <form onSubmit={createTicket} className="rounded-xl border border-[#333] bg-[#111] p-4 space-y-3">
        <h2 className="text-lg font-semibold text-white">{t("tickets.newTicket")}</h2>
        <input
          value={form.subject}
          onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
          placeholder={t("tickets.subject")}
          className="w-full rounded-lg border border-[#333] bg-[#0b0b0b] p-2.5 text-sm text-white"
          required
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder={t("tickets.describeIssue")}
          className="min-h-28 w-full rounded-lg border border-[#333] bg-[#0b0b0b] p-3 text-sm text-white"
          required
        />
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            className="rounded-lg border border-[#333] bg-[#0b0b0b] p-2.5 text-sm text-white"
          >
            <option value="GENERAL">{t("tickets.categoryGeneral")}</option>
            <option value="LICENSE">{t("tickets.categoryLicense")}</option>
            <option value="PAYMENT">{t("tickets.categoryPayment")}</option>
            <option value="TECHNICAL">{t("tickets.categoryTechnical")}</option>
            <option value="REFUND">{t("tickets.categoryRefund")}</option>
            <option value="BUG_REPORT">{t("tickets.categoryBugReport")}</option>
          </select>
          <select
            value={form.priority}
            onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            className="rounded-lg border border-[#333] bg-[#0b0b0b] p-2.5 text-sm text-white"
          >
            <option value="LOW">{t("tickets.priorityLow")}</option>
            <option value="MEDIUM">{t("tickets.priorityMedium")}</option>
            <option value="HIGH">{t("tickets.priorityHigh")}</option>
            <option value="URGENT">{t("tickets.priorityUrgent")}</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
        >
          {creating ? t("tickets.creating") : t("tickets.createTicket")}
        </button>
      </form>

      <div className="rounded-xl border border-[#333] bg-[#111] p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">{t("tickets.myTickets")}</h2>
        {loading ? <p className="text-sm text-gray-400">{t("common.loading")}</p> : null}
        {!loading && tickets.length === 0 ? (
          <p className="text-sm text-gray-500">{t("tickets.noTicketsYet")}</p>
        ) : null}
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/dashboard/tickets/${ticket.ticketNumber}`}
              className="block rounded-lg border border-[#2f2f2f] bg-[#0b0b0b] p-3 hover:border-[#4a4a4a]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{ticket.subject}</p>
                  <p className="text-xs text-gray-500">
                    {ticket.ticketNumber} · {ticket.status} · {ticket.priority}
                  </p>
                </div>
                <p className="text-xs text-gray-500">{ticket._count.messages} {t("tickets.messages")}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
