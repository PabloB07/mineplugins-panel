"use client";

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
  | "BarChart3" | "Monitor" | "MapPin" | "Sparkles"
  | "Bell" | "MessagesSquare" | "Timer" | "TriangleAlert"
  | "LifeBuoy" | "MessageCircle" | "PlusCircle" | "FileText" | "KeyRound"
  | "Percent" | "Tag" | "Ticket" | "Wallet";

const minecraftIconMap: Record<IconName, string> = {
  Users: "icon-minecraft-player-head",
  Key: "icon-minecraft-trial-key",
  ShoppingCart: "icon-minecraft-barrel",
  DollarSign: "icon-minecraft-diamond-block",
  Activity: "icon-minecraft-observer",
  ArrowRight: "icon-minecraft-arrow",
  Package: "icon-minecraft-barrel",
  Clock: "icon-minecraft-clock",
  Server: "icon-minecraft-compass",
  CheckCircle: "icon-minecraft-emerald-block",
  XCircle: "icon-minecraft-redstone-block",
  TrendingUp: "icon-minecraft-compass",
  AlertTriangle: "icon-minecraft-tnt",
  Plus: "icon-minecraft-green-stone-button",
  Download: "icon-minecraft-paper",
  Shield: "icon-minecraft-iron-block",
  Crown: "icon-minecraft-gold-block",
  UserPlus: "icon-minecraft-player-head",
  Link: "icon-minecraft-chain",
  Ban: "icon-minecraft-barrier",
  Globe: "icon-minecraft-globe-banner-pattern",
  ChevronDown: "icon-minecraft-arrow",
  Check: "icon-minecraft-emerald-block",
  Zap: "icon-minecraft-diamond",
  ArrowLeft: "icon-minecraft-arrow",
  CreditCard: "icon-minecraft-paper",
  Loader2: "icon-minecraft-clock",
  Upload: "icon-minecraft-dropper",
  X: "icon-minecraft-barrier",
  Save: "icon-minecraft-bookshelf",
  Trash2: "icon-minecraft-barrier",
  ExternalLink: "icon-minecraft-paper",
  Star: "icon-minecraft-gold-block",
  AlertCircle: "icon-minecraft-tnt",
  Wifi: "icon-minecraft-repeater",
  WifiOff: "icon-minecraft-redstone-block",
  CloudUpload: "icon-minecraft-dropper",
  Edit2: "icon-minecraft-book",
  LogOut: "icon-minecraft-door",
  User: "icon-minecraft-player-head",
  Copy: "icon-minecraft-paper",
  UploadCloud: "icon-minecraft-dropper",
  Power: "icon-minecraft-redstone-block",
  Edit: "icon-minecraft-book",
  Eye: "icon-minecraft-player-head",
  EyeOff: "icon-minecraft-barrier",
  Filter: "icon-minecraft-hopper",
  ChevronLeft: "icon-minecraft-arrow",
  ChevronRight: "icon-minecraft-arrow",
  ShieldX: "icon-minecraft-barrier",
  Mail: "icon-minecraft-paper",
  Calendar: "icon-minecraft-clock",
  ShoppingBag: "icon-minecraft-barrel",
  RotateCcw: "icon-minecraft-clock",
  BarChart3: "icon-minecraft-grass-block",
  Monitor: "icon-minecraft-observer",
  MapPin: "icon-minecraft-compass",
  Search: "icon-minecraft-compass",
  Sparkles: "icon-minecraft-diamond-block",
  RefreshCw: "icon-minecraft-clock",
  Bell: "icon-minecraft-bell",
  MessagesSquare: "icon-minecraft-book",
  Timer: "icon-minecraft-clock",
  TriangleAlert: "icon-minecraft-tnt",
  LifeBuoy: "icon-minecraft-lantern",
  MessageCircle: "icon-minecraft-book",
  PlusCircle: "icon-minecraft-green-stone-button",
  FileText: "icon-minecraft-paper",
  KeyRound: "icon-minecraft-trial-key",
  Percent: "icon-minecraft-iron-block",
  Tag: "icon-minecraft-banner",
  Ticket: "icon-minecraft-paper",
  Wallet: "icon-minecraft-diamond-block",
};

interface IconProps {
  name: IconName;
  className?: string;
}

function MinecraftIcon({ name, className = "w-4 h-4" }: { name: string; className?: string }) {
  const useLargeSprite = /\b(?:w|h)-(6|7|8|9|10|11|12)\b/.test(className);
  const spriteBaseClass = useLargeSprite ? "icon-minecraft" : "icon-minecraft-sm";
  const minecraftClass = minecraftIconMap[name as IconName];
  const cleanedClassName = className.replace(/\b(?:w|h)-\d+\b/g, "").trim();

  return (
    <span
      aria-hidden="true"
      className={`${spriteBaseClass} ${minecraftClass} inline-block shrink-0 ${cleanedClassName}`.trim()}
    />
  );
}

const ICONS = (() => {
  const icons: Record<IconName, React.FC<{ className?: string }>> = {} as any;
  for (const name of Object.keys(minecraftIconMap)) {
    const iconName = name as IconName;
    icons[iconName] = (props: { className?: string }) => (
      <MinecraftIcon name={iconName} className={props.className} />
    );
  }
  return icons;
})();

export function Icon({ name, className = "w-4 h-4" }: IconProps) {
  const IconComp = ICONS[name] || ICONS.Package;
  return <IconComp className={className} />;
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