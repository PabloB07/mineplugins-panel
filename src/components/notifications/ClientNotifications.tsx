"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";

interface ClientNotificationCounts {
  ticketsToReply: number;
  pendingOrders: number;
  expiringLicenses: number;
}

export function ClientNotifications() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [counts, setCounts] = useState<ClientNotificationCounts>({
    ticketsToReply: 0,
    pendingOrders: 0,
    expiringLicenses: 0,
  });
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/client", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setUnreadTotal(Number(data?.unreadTotal || 0));
      setCounts({
        ticketsToReply: Number(data?.counts?.ticketsToReply || 0),
        pendingOrders: Number(data?.counts?.pendingOrders || 0),
        expiringLicenses: Number(data?.counts?.expiringLicenses || 0),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const stream = new EventSource("/api/notifications/stream?scope=client");

    stream.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setUnreadTotal(Number(data?.unreadTotal || 0));
        setCounts({
          ticketsToReply: Number(data?.counts?.ticketsToReply || 0),
          pendingOrders: Number(data?.counts?.pendingOrders || 0),
          expiringLicenses: Number(data?.counts?.expiringLicenses || 0),
        });
        setLoading(false);
      } catch {
        // ignore malformed events
      }
    };

    stream.onerror = () => {
      // Browser auto-reconnect handles transient connection issues.
    };

    return () => {
      stream.close();
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const items = [
    {
      key: "tickets",
      href: "/dashboard/tickets",
      count: counts.ticketsToReply,
      title: t("notifications.client.ticketsTitle"),
      desc: t("notifications.client.ticketsDesc"),
    },
    {
      key: "orders",
      href: "/orders",
      count: counts.pendingOrders,
      title: t("notifications.client.ordersTitle"),
      desc: t("notifications.client.ordersDesc"),
    },
    {
      key: "licenses",
      href: "/dashboard/licenses",
      count: counts.expiringLicenses,
      title: t("notifications.client.licensesTitle"),
      desc: t("notifications.client.licensesDesc"),
    },
  ].filter((item) => item.count > 0);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-lg p-2 text-gray-400 hover:bg-[#111] hover:text-white"
        title={t("notifications.title")}
      >
        <Bell className="h-5 w-5" />
        {!loading && unreadTotal > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold text-white">
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] shadow-2xl z-50">
          <div className="border-b border-[#1f1f1f] px-4 py-3">
            <p className="text-sm font-semibold text-white">{t("notifications.title")}</p>
          </div>
          <div className="max-h-80 overflow-auto">
            {items.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-500">{t("notifications.empty")}</p>
            ) : (
              items.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-[#1a1a1a] px-4 py-3 hover:bg-[#151515]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                      {item.count}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
