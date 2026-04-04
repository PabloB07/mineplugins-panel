"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";

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

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets?status=${filter}`);
      const data = await res.json();
      if (data.tickets) setTickets(data.tickets);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-500/20 text-blue-400";
      case "IN_PROGRESS": return "bg-yellow-500/20 text-yellow-400";
      case "WAITING_REPLY": return "bg-orange-500/20 text-orange-400";
      case "RESOLVED": return "bg-green-500/20 text-green-400";
      case "CLOSED": return "bg-gray-500/20 text-gray-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "text-red-400";
      case "HIGH": return "text-orange-400";
      case "MEDIUM": return "text-yellow-400";
      case "LOW": return "text-green-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">{t("tickets.adminTitle")}</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white">
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
          {tickets.map((ticket) => (
            <a key={ticket.id} href={`/admin/tickets/${ticket.ticketNumber}`} className="block bg-[#111] rounded-xl border border-[#333] p-4 hover:border-[#f59e0b]/50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500 text-sm font-mono">{ticket.ticketNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                    <span className={`text-xs ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                  </div>
                  <h3 className="text-white font-medium">{ticket.subject}</h3>
                  <p className="text-gray-500 text-sm mt-1">{ticket.user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-sm">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  <p className="text-gray-500 text-sm">{ticket._count.messages} {t("tickets.messages")}</p>
                </div>
              </div>
            </a>
          ))}
          {tickets.length === 0 && (
            <div className="text-center text-gray-500 py-12">{t("tickets.noTickets")}</div>
          )}
        </div>
      )}
    </div>
  );
}
