"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

const locales = [
  { code: "es", name: "Español", currency: "CLP", flag: "🇨🇱" },
  { code: "en", name: "English", currency: "USD", flag: "🇺🇸" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocaleChange = (newLocale: string) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div className="relative z-[200]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-[#222]"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm uppercase">{locale}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-[#111] border border-[#222] rounded-lg shadow-xl z-[201] overflow-hidden">
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => handleLocaleChange(loc.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#222] transition-colors ${
                locale === loc.code ? "text-green-400 bg-green-400/5" : "text-gray-300"
              }`}
            >
              <span className="text-lg">{loc.flag}</span>
              <span className="flex-1 text-left">{loc.name}</span>
              <span className="text-xs text-gray-500">{loc.currency}</span>
              {locale === loc.code && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
