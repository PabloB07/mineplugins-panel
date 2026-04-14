"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Currency } from "@/i18n/I18nProvider";
import { useIcon } from "@/hooks/useIcon";

const currencies: { id: Currency; symbol: string; shortName: string; description: string }[] = [
  { id: 'USD', symbol: '$', shortName: 'USD', description: 'US Dollar (exact price)' },
  { id: 'CLP', symbol: '$', shortName: 'CLP', description: 'Chilean Peso (exact price)' },
  { id: 'EUR', symbol: '€', shortName: 'EUR', description: 'Euro (approx.)' },
  { id: 'CAD', symbol: '$', shortName: 'CAD', description: 'Canadian Dollar (approx.)' },
];

export function CurrencySwitcher() {
  const { currency, setCurrency, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const Globe = useIcon("Globe");
  const ChevronDown = useIcon("ChevronDown");
  const Check = useIcon("Check");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentCurrency = currencies.find(c => c.id === currency) || currencies[0];

  return (
    <div className="relative z-[200]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-[#222]"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{currentCurrency.shortName}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 bg-[#111] border border-[#222] rounded-lg shadow-xl z-[201] overflow-hidden">
          <div className="p-2">
            <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
              {t("currency.selectCurrency")}
            </div>
            {currencies.map((curr) => (
              <button
                key={curr.id}
                onClick={() => {
                  setCurrency(curr.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-[#222] transition-colors ${
                  currency === curr.id
                    ? "text-green-400 bg-green-400/5"
                    : "text-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-[#0a0a0a] border border-[#222] flex items-center justify-center text-xs font-bold font-mono">
                    {curr.symbol}
                  </span>
                  <span>{t(`currency.${curr.id}`)}</span>
                </div>
                {currency === curr.id && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-[#222] bg-[#0a0a0a]/50">
            <p className="text-[10px] leading-tight text-gray-500">
              Prices shown in USD/CLP are exact. Other currencies are approximate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}