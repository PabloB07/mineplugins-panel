"use client";

import { useI18n } from "@/i18n/I18nProvider";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: "green" | "amber" | "blue" | "white";
}

const sizes = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

const colors = {
  green: "text-[#22c55e]",
  amber: "text-[#f59e0b]",
  blue: "text-blue-400",
  white: "text-gray-400",
};

export function LoadingSpinner({ size = "md", className = "", color = "green" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className={`icon-minecraft ${sizes[size]} ${colors[color]} animate-spin`} />
    </div>
  );
}

export function LoadingCard({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div className={`bg-[#111] rounded-xl border border-[#222] p-8 ${className}`}>
      <div className="flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-400">{t("common.loading")}</p>
      </div>
    </div>
  );
}
