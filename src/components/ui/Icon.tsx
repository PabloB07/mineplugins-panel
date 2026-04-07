"use client";

import { useIcon } from "@/hooks/useIcon";

type IconName = Parameters<typeof useIcon>[0];

const minecraftIconMap: Partial<Record<IconName, string>> = {
  Users: "icon-minecraft-player-head",
  Key: "icon-minecraft-trial-key",
  ShoppingCart: "icon-minecraft-barrel",
  DollarSign: "icon-minecraft-diamond-block",
  Activity: "icon-minecraft-observer",
  ArrowRight: "icon-minecraft-arrow",
  Package: "icon-minecraft-barrel",
  Clock: "icon-minecraft-clock",
  Server: "icon-minecraft-grass-block",
  CheckCircle: "icon-minecraft-emerald-block",
  XCircle: "icon-minecraft-tnt",
  TrendingUp: "icon-minecraft-compass",
  AlertTriangle: "icon-minecraft-tnt",
  Plus: "icon-minecraft-green-stone-button",
  Download: "icon-minecraft-paper",
  Search: "icon-minecraft-compass",
  Globe: "icon-minecraft-globe-banner-pattern",
  Calendar: "icon-minecraft-clock",
  ShoppingBag: "icon-minecraft-barrel",
  Monitor: "icon-minecraft-observer",
  MapPin: "icon-minecraft-compass",
  Check: "icon-minecraft-emerald-block",
  CreditCard: "icon-minecraft-paper",
  Zap: "icon-minecraft-diamond",
  Sparkles: "icon-minecraft-diamond-block",
  RefreshCw: "icon-minecraft-clock",
};

function MinecraftIcon({ name, className = "w-4 h-4" }: IconProps) {
  const minecraftClass = minecraftIconMap[name];
  if (!minecraftClass) return null;

  const useLargeSprite = /\b(?:w|h)-(6|7|8|9|10|11|12)\b/.test(className);
  const spriteBaseClass = useLargeSprite ? "icon-minecraft" : "icon-minecraft-sm";
  const cleanedClassName = className.replace(/\b(?:w|h)-\d+\b/g, "").trim();

  return (
    <span
      aria-hidden="true"
      className={`${spriteBaseClass} ${minecraftClass} inline-block shrink-0 ${cleanedClassName}`.trim()}
    />
  );
}

interface IconProps {
  name: IconName;
  className?: string;
}

export function Icon({ name, className = "w-4 h-4" }: IconProps) {
  const IconComponent = useIcon(name);
  const minecraftIcon = MinecraftIcon({ name, className });
  if (minecraftIcon) return minecraftIcon;

  return <IconComponent className={className} />;
}

interface IconLabelProps {
  name: IconName;
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

export function IconLabel({ name, children, className = "", iconClassName = "w-4 h-4" }: IconLabelProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Icon name={name} className={iconClassName} />
      {children}
    </span>
  );
}

interface IconHeaderProps {
  name: IconName;
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

export function IconHeader({ name, children, className = "", iconClassName = "w-5 h-5" }: IconHeaderProps) {
  return (
    <h2 className={`text-lg font-semibold text-white flex items-center gap-2 ${className}`}>
      <Icon name={name} className={iconClassName} />
      {children}
    </h2>
  );
}
