"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  user: { id: string; email: string; name: string | null };
  assignedTo: { id: string; name: string } | null;
  _count: { messages: number };
}

export default function AdminTicketsPage() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets?status=${filter}`);
      const data = await res.json();
      if (data.tickets) setTickets(data.tickets);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tickets;
    return tickets.filter(
      (ticket) =>
        ticket.ticketNumber.toLowerCase().includes(term) ||
        ticket.subject.toLowerCase().includes(term) ||
        ticket.user.email.toLowerCase().includes(term)
    );
  }, [search, tickets]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "IN_PROGRESS":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "WAITING_REPLY":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "RESOLVED":
        return "bg-green-500/20 text-green-300 border-green-500/40";
      case "CLOSED":
        return "bg-gray-500/20 text-gray-300 border-gray-500/40";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/40";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-400";
      case "HIGH":
        return "text-orange-400";
      case "MEDIUM":
        return "text-yellow-400";
      case "LOW":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "OPEN" || t.status === "WAITING_REPLY").length;
    const urgent = tickets.filter((t) => t.priority === "URGENT").length;
    return { total, open, urgent };
  }, [tickets]);

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-[#2f2f2f] bg-gradient-to-br from-[#151515] to-[#0d0d0d] p-6">
        <h1 className="text-2xl font-bold text-white">{t("tickets.adminTitle")}</h1>
        <p className="mt-1 text-sm text-gray-400">{t("tickets.adminSubtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="pixel-frame pixel-frame-neutral rounded-xl border border-[#333] bg-[#111] p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">{t("tickets.total")}</p>
              <p className="mt-1 text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-2 text-blue-300">
              <Icon name="MessagesSquare" className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="pixel-frame pixel-frame-neutral rounded-xl border border-[#333] bg-[#111] p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">{t("tickets.pendingResponse")}</p>
              <p className="mt-1 text-2xl font-bold text-white">{stats.open}</p>
            </div>
            <div className="rounded-lg border border-orange-500/40 bg-orange-500/10 p-2 text-orange-300">
              <Icon name="Timer" className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="pixel-frame pixel-frame-neutral rounded-xl border border-[#333] bg-[#111] p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">{t("tickets.urgent")}</p>
              <p className="mt-1 text-2xl font-bold text-white">{stats.urgent}</p>
            </div>
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-red-300">
              <Icon name="TriangleAlert" className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("tickets.searchPlaceholder")}
          className="md:col-span-2 rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white"
        >
          <option value="all">{t("common.all")}</option>
          <option value="OPEN">{t("tickets.statusOpen")}</option>
          <option value="IN_PROGRESS">{t("tickets.statusInProgress")}</option>
          <option value="WAITING_REPLY">{t("tickets.statusWaitingReply")}</option>
          <option value="RESOLVED">{t("tickets.statusResolved")}</option>
          <option value="CLOSED">{t("tickets.statusClosed")}</option>
        </select>
      </div>

      {loading ? (
        <div className="text-gray-400">{t("common.loading")}</div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/admin/tickets/${ticket.ticketNumber}`}
              className="pixel-frame pixel-frame-neutral block rounded-xl border border-[#333] bg-[#111] p-4 transition-colors hover:border-[#f59e0b]/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">{ticket.ticketNumber}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className={`text-[11px] font-semibold ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                  </div>
                  <h3 className="truncate text-sm font-semibold text-white">{ticket.subject}</h3>
                  <p className="mt-1 text-xs text-gray-500">{ticket.user.email}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  <p className="mt-1">{ticket._count.messages} {t("tickets.messages")}</p>
                </div>
              </div>
            </Link>
          ))}
          {filteredTickets.length === 0 ? (
            <div className="pixel-frame pixel-frame-neutral rounded-xl border border-[#333] bg-[#111] py-10 text-center text-gray-500">
              {t("tickets.noTickets")}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
