"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";

interface TicketMessage {
  id: string;
  content: string;
  attachmentUrl?: string | null;
  isAdmin: boolean;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

interface TicketDetail {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  messages: TicketMessage[];
}

export default function DashboardTicketDetailPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

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

  const fetchTicket = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${params.id}`);
      const data = await res.json();
      setTicket(data.ticket || null);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchTicket(false);
      const interval = setInterval(() => fetchTicket(true), 3000);
      return () => clearInterval(interval);
    }
  }, [params.id, fetchTicket]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticket || (!message.trim() && !attachment)) return;
    setSending(true);
    try {
      let attachmentUrl = null;
      if (attachment) {
        const formData = new FormData();
        formData.append("file", attachment);
        const { handleTicketAttachmentUpload } = await import("@/lib/file-actions");
        const res = await handleTicketAttachmentUpload(formData);
        attachmentUrl = res.url;
      }

      await fetch(`/api/tickets/${ticket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message.trim(), attachmentUrl }),
      });
      setMessage("");
      setAttachment(null);
      await fetchTicket();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    if (!ticket) return;
    await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    });
    await fetchTicket();
  };

  if (loading) return <div className="p-6 text-gray-400">{t("tickets.loadingTicket")}</div>;
  if (!ticket) return <div className="p-6 text-red-400">{t("tickets.notFound")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/tickets" className="text-sm text-gray-400 hover:text-white">
          ← {t("tickets.backToSupport")}
        </Link>
        <span className="text-xs font-mono text-gray-500">{ticket.ticketNumber}</span>
      </div>

      <div className="rounded-2xl border border-[#2f2f2f] bg-gradient-to-br from-[#151515] to-[#0d0d0d] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
            <p className="text-sm text-gray-500">{ticket.priority} · {ticket.category}</p>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(ticket.status)}`}>
            {ticket.status}
          </span>
          {ticket.status !== "CLOSED" ? (
            <button
              type="button"
              onClick={closeTicket}
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300"
            >
              {t("tickets.closeTicket")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-[#333] bg-[#111] p-4 space-y-3">
        <h2 className="text-lg font-semibold text-white">{t("tickets.conversation")}</h2>
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg border p-3 ${msg.isAdmin ? "border-blue-500/30 bg-blue-500/10" : "border-[#333] bg-[#0b0b0b]"}`}
          >
            <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
              <span className="font-medium">{msg.isAdmin ? t("tickets.support") : msg.user.name || msg.user.email}</span>
              <span>{new Date(msg.createdAt).toLocaleString()}</span>
            </div>
            {msg.content && <p className="whitespace-pre-wrap text-sm text-gray-200">{msg.content}</p>}
            {msg.attachmentUrl && (
              <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
                <img src={msg.attachmentUrl} alt="Attachment" className="mt-2 max-w-sm rounded border border-[#333] hover:opacity-80 transition-opacity" />
              </a>
            )}
          </div>
        ))}
      </div>

      {ticket.status !== "CLOSED" ? (
        <form onSubmit={sendMessage} className="rounded-xl border border-[#333] bg-[#111] p-4 space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-28 w-full rounded-lg border border-[#333] bg-[#0b0b0b] p-3 text-sm text-white"
            placeholder={t("tickets.writeReply")}
          />
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#22c55e]/10 file:text-[#22c55e] hover:file:bg-[#22c55e]/20"
              disabled={sending}
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
          >
            {sending ? t("tickets.sending") : t("tickets.sendMessage")}
          </button>
        </form>
      ) : null}
    </div>
  );
}
