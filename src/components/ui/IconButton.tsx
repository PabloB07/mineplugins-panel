"use client";

import { Icon } from "./Icon";

type IconName = Parameters<typeof Icon>[0]["name"];

interface IconButtonProps {
  icon: IconName;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "danger" | "success" | "info";
  size?: "sm" | "md" | "lg";
  className?: string;
  title?: string;
  disabled?: boolean;
}

const variants = {
  default: "hover:bg-[#222] text-gray-400 hover:text-white",
  danger: "hover:bg-red-500/10 text-gray-400 hover:text-red-400",
  success: "hover:bg-[#22c55e]/10 text-gray-400 hover:text-[#22c55e]",
  info: "hover:bg-blue-500/10 text-blue-400 hover:text-blue-300",
};

const sizes = {
  sm: "p-1",
  md: "p-2",
  lg: "p-3",
};

export function IconButton({ icon, onClick, href, variant = "default", size = "md", className = "", title, disabled }: IconButtonProps) {
  const iconSizes = { sm: "w-4 h-4", md: "w-4 h-4", lg: "w-5 h-5" };

  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-lg transition-all ${variants[variant]} ${sizes[size]} ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <Icon name={icon} className={iconSizes[size]} />
    </button>
  );

  if (href) {
    return (
      <a href={href} className={`inline-block ${disabled ? "pointer-events-none opacity-50" : ""}`}>
        {button}
      </a>
    );
  }

  return button;
}
