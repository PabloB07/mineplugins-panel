"use client";

import { Globe } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-[#222]"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm uppercase">{locale}</span>
      </button>
      
      <div className="absolute right-0 mt-1 w-32 bg-[#111] border border-[#222] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <button
          onClick={() => setLocale("es")}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-[#222] transition-colors first:rounded-t-lg last:rounded-b-lg ${
            locale === "es" ? "text-green-400" : "text-gray-300"
          }`}
        >
          Español
        </button>
        <button
          onClick={() => setLocale("en")}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-[#222] transition-colors first:rounded-t-lg last:rounded-b-lg ${
            locale === "en" ? "text-green-400" : "text-gray-300"
          }`}
        >
          English
        </button>
      </div>
    </div>
  );
}
