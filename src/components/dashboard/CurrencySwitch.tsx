"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { Icon } from "@/components/ui/Icon";
import { useState, useEffect } from "react";
import type { Currency } from "@/lib/pricing";

export default function CurrencySwitch() {
  const { currency, setCurrency } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currencies: { value: Currency; label: string; symbol: string }[] = [
    { value: "USD", label: "US Dollar", symbol: "$" },
    { value: "CLP", label: "Peso Chileno", symbol: "$" },
    { value: "EUR", label: "Euro", symbol: "€" },
    { value: "CAD", label: "Canadian Dollar", symbol: "$" },
  ];

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-[#333]">
        <Icon name="DollarSign" className="w-4 h-4 text-green-400" />
        <span className="text-sm font-medium text-gray-400">...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-[#333] hover:border-[#f59e0b]/50 transition-all text-gray-300 hover:text-white"
      >
        <Icon name="DollarSign" className="w-4 h-4 text-green-400" />
        <span className="text-sm font-medium">{currency}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-[#111] border border-[#333] rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-2">
              <div className="text-xs text-gray-500 px-3 py-2 flex items-center gap-2">
                <Icon name="Globe" className="w-3 h-3" />
                Currency
              </div>
              {currencies.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    setCurrency(c.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                    currency === c.value
                      ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                      : "text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                  }`}
                >
                  <span>{c.label}</span>
                  <span className="text-gray-500">{c.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
