"use client";

import { useIcon } from "@/hooks/useIcon";

type IconName =
  | "Users" | "Key" | "ShoppingCart" | "DollarSign" | "Activity"
  | "ArrowRight" | "Package" | "Clock" | "Server" | "CheckCircle"
  | "XCircle" | "TrendingUp" | "AlertTriangle" | "Plus" | "Download"
  | "Shield" | "Crown" | "Search" | "UserPlus" | "Link" | "Ban"
  | "Globe" | "ChevronDown" | "Check" | "Zap" | "ArrowLeft"
  | "CreditCard" | "Loader2" | "Upload" | "X" | "Save" | "Trash2"
  | "ExternalLink" | "Star" | "AlertCircle" | "Wifi" | "WifiOff"
  | "CloudUpload" | "RefreshCw" | "Edit2" | "LogOut" | "User"
  | "Copy" | "UploadCloud" | "Power" | "Edit" | "Eye" | "EyeOff"
  | "Filter" | "ChevronLeft" | "ChevronRight" | "ShieldX"
  | "Mail" | "Calendar" | "ShoppingBag" | "RotateCcw"
  | "BarChart3" | "Monitor" | "MapPin" | "Sparkles" | "FileText"
  | "Bell" | "MessagesSquare" | "Timer" | "TriangleAlert"
  | "LifeBuoy" | "MessageCircle" | "PlusCircle" | "KeyRound"
  | "Percent" | "Tag" | "Ticket" | "Wallet";

interface IconProps {
  name: IconName;
  className?: string;
}

export function Icon({ name, className = "w-4 h-4" }: IconProps) {
  const IconComponent = useIcon(name);
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