"use client";

import { Icon } from "./Icon";

type AlertType = "error" | "success" | "warning" | "info";

interface AlertBoxProps {
  type: AlertType;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

const alertStyles: Record<AlertType, { bg: string; border: string; text: string; icon: string }> = {
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    icon: "AlertCircle",
  },
  success: {
    bg: "bg-[#22c55e]/10",
    border: "border-[#22c55e]/30",
    text: "text-[#22c55e]",
    icon: "CheckCircle",
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    icon: "AlertTriangle",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    icon: "AlertCircle",
  },
};

export function AlertBox({ type, title, children, className = "", onDismiss }: AlertBoxProps) {
  const style = alertStyles[type];

  return (
    <div className={`p-4 rounded-xl border ${style.bg} ${style.border} ${style.text} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon name={style.icon as any} className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <p className="font-medium mb-1">{title}</p>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
          >
            <Icon name="X" className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
