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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#181818] border border-[#333] hover:border-[#444] transition-all text-sm"
      >
        <Globe className="w-4 h-4 text-gray-400" />
        <span className="text-white font-medium">{currentCurrency.shortName}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          role="listbox"
          className="absolute left-0 right-auto mt-2 w-56 rounded-xl bg-[#111] border border-[#333] shadow-xl overflow-hidden"
          style={{ left: 'auto', right: 0 }}
        >
          <div className="p-2">
            <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
              {t("currency.selectCurrency")}
            </div>
            {currencies.map((curr) => (
              <button
                key={curr.id}
                type="button"
                role="option"
                aria-selected={currency === curr.id}
                onClick={() => {
                  setCurrency(curr.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left ${
                  currency === curr.id
                    ? "bg-[#22c55e]/10 text-[#22c55e]"
                    : "text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#0a0a0a] border border-[#222] flex items-center justify-center text-sm font-bold">
                    {curr.symbol}
                  </span>
                  <span className="font-medium">{t(`currency.${curr.id}`)}</span>
                </div>
                {currency === curr.id && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-[#222]">
            <p className="text-[10px] text-gray-500">
              Prices shown in USD/CLP are exact. Other currencies are approximate based on current exchange rates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}