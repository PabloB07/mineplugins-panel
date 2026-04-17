"use client";

import Link from "next/link";
import { Icon } from "./Icon";

type IconName = Parameters<typeof Icon>[0]["name"];

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`bg-[#111] rounded-xl border border-[#222] p-12 text-center ${className}`}>
      <div className="w-16 h-16 bg-[#181818] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#2a2a2a]">
        <Icon name={icon} className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 bg-[#22c55e] text-black hover:bg-[#16a34a] font-bold py-3 px-6 rounded-xl transition-transform hover:scale-105"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 bg-[#22c55e] text-black hover:bg-[#16a34a] font-bold py-3 px-6 rounded-xl transition-transform hover:scale-105"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
