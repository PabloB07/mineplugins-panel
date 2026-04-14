"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Icon } from "@/components/ui/Icon";

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

  const activeCount = useMemo(
    () => tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS" || t.status === "WAITING_REPLY").length,
    [tickets]
  );

  const closedCount = useMemo(() => tickets.filter((t) => t.status === "CLOSED").length, [tickets]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#2f2f2f] bg-gradient-to-br from-[#151515] to-[#0d0d0d] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{t("tickets.title")}</h1>
            <p className="mt-1 text-sm text-gray-400">{t("tickets.subtitle")}</p>
          </div>
          <div className="rounded-lg border border-[#3a3a3a] bg-[#121212] p-2.5">
            <Icon name="LifeBuoy" className="h-5 w-5 text-green-400" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[#2f2f2f] bg-[#111] p-3">
            <p className="text-xs text-gray-500">{t("tickets.total")}</p>
            <p className="text-xl font-bold text-white">{tickets.length}</p>
          </div>
          <div className="rounded-lg border border-[#2f2f2f] bg-[#111] p-3">
            <p className="text-xs text-gray-500">{t("tickets.active")}</p>
            <p className="text-xl font-bold text-white">{activeCount}</p>
          </div>
          <div className="rounded-lg border border-[#2f2f2f] bg-[#111] p-3">
            <p className="text-xs text-gray-500">{t("tickets.closed")}</p>
            <p className="text-xl font-bold text-white">{closedCount}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <form onSubmit={createTicket} className="rounded-xl border border-[#333] bg-[#111] p-5 space-y-4 xl:col-span-2">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Icon name="PlusCircle" className="h-4 w-4 text-green-400" />
            {t("tickets.newTicket")}
          </h2>
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
            className="min-h-32 w-full rounded-lg border border-[#333] bg-[#0b0b0b] p-3 text-sm text-white"
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
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
            className="w-full rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
          >
            {creating ? t("tickets.creating") : t("tickets.createTicket")}
          </button>
        </form>

        <div className="rounded-xl border border-[#333] bg-[#111] p-5 xl:col-span-3">
          <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
            <Icon name="MessageCircle" className="h-4 w-4 text-blue-400" />
            {t("tickets.myTickets")}
          </h2>
          {loading ? <p className="text-sm text-gray-400">{t("common.loading")}</p> : null}
          {!loading && tickets.length === 0 ? (
            <p className="text-sm text-gray-500">{t("tickets.noTicketsYet")}</p>
          ) : null}
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/tickets/${ticket.ticketNumber}`}
                className="block rounded-lg border border-[#2f2f2f] bg-[#0b0b0b] p-3 transition-colors hover:border-[#4a4a4a]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{ticket.subject}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {ticket.ticketNumber} · {ticket.status} · {ticket.priority}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 whitespace-nowrap">
                    {ticket._count.messages} {t("tickets.messages")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
