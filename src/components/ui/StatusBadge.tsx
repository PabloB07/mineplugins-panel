"use client";

type Status = "ACTIVE" | "EXPIRED" | "PENDING" | "SUSPENDED" | "CANCELLED" | "COMPLETED" | "FAILED" | "BANNED" | "ONLINE" | "OFFLINE" | string;

interface StatusBadgeProps {
  status: Status;
  className?: string;
  showDot?: boolean;
}

const statusStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  ACTIVE: { bg: "bg-[#22c55e]/20", text: "text-[#22c55e]", border: "border-[#22c55e]/30", dot: "bg-[#22c55e]" },
  COMPLETED: { bg: "bg-[#22c55e]/20", text: "text-[#22c55e]", border: "border-[#22c55e]/30", dot: "bg-[#22c55e]" },
  ONLINE: { bg: "bg-[#22c55e]/20", text: "text-[#22c55e]", border: "border-[#22c55e]/30", dot: "bg-[#22c55e]" },
  PENDING: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30", dot: "bg-yellow-400" },
  SUSPENDED: { bg: "bg-yellow-500/20", text: "text-yellow-300", border: "border-yellow-500/30", dot: "bg-yellow-300" },
  EXPIRED: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", dot: "bg-red-400" },
  CANCELLED: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", dot: "bg-red-400" },
  FAILED: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", dot: "bg-red-400" },
  BANNED: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", dot: "bg-red-400" },
  OFFLINE: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", dot: "bg-red-400" },
};

const defaultStyle = { bg: "bg-[#181818]", text: "text-gray-400", border: "border-[#333]", dot: "bg-gray-500" };

export function StatusBadge({ status, className = "", showDot = true }: StatusBadgeProps) {
  const style = statusStyles[status.toUpperCase()] || defaultStyle;

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${style.bg} ${style.text} ${style.border} ${className}`}>
      {showDot && <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${style.dot}`} />}
      {status}
    </span>
  );
}
