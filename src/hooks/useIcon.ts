"use client";

import dynamic from "next/dynamic";

const iconCache = new Map<string, React.ComponentType<{ className?: string }>>();

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
  | "Filter" | "ChevronLeft" | "ChevronRight" | "ShoppingCart"
  | "ShieldX" | "Mail" | "Calendar" | "ShoppingBag" | "RotateCcw"
  | "BarChart3" | "Monitor" | "MapPin";

const iconMap: Record<IconName, string> = {
  Users: "lucide-react",
  Key: "lucide-react",
  ShoppingCart: "lucide-react",
  DollarSign: "lucide-react",
  Activity: "lucide-react",
  ArrowRight: "lucide-react",
  Package: "lucide-react",
  Clock: "lucide-react",
  Server: "lucide-react",
  CheckCircle: "lucide-react",
  XCircle: "lucide-react",
  TrendingUp: "lucide-react",
  AlertTriangle: "lucide-react",
  Plus: "lucide-react",
  Download: "lucide-react",
  Shield: "lucide-react",
  Crown: "lucide-react",
  Search: "lucide-react",
  UserPlus: "lucide-react",
  Link: "lucide-react",
  Ban: "lucide-react",
  Globe: "lucide-react",
  ChevronDown: "lucide-react",
  Check: "lucide-react",
  Zap: "lucide-react",
  ArrowLeft: "lucide-react",
  CreditCard: "lucide-react",
  Loader2: "lucide-react",
  Upload: "lucide-react",
  X: "lucide-react",
  Save: "lucide-react",
  Trash2: "lucide-react",
  ExternalLink: "lucide-react",
  Star: "lucide-react",
  AlertCircle: "lucide-react",
  Wifi: "lucide-react",
  WifiOff: "lucide-react",
  CloudUpload: "lucide-react",
  RefreshCw: "lucide-react",
  Edit2: "lucide-react",
  LogOut: "lucide-react",
  User: "lucide-react",
  Copy: "lucide-react",
  UploadCloud: "lucide-react",
  Power: "lucide-react",
  Edit: "lucide-react",
  Eye: "lucide-react",
  EyeOff: "lucide-react",
  Filter: "lucide-react",
  ChevronLeft: "lucide-react",
  ChevronRight: "lucide-react",
  ShieldX: "lucide-react",
  Mail: "lucide-react",
  Calendar: "lucide-react",
  ShoppingBag: "lucide-react",
  RotateCcw: "lucide-react",
  BarChart3: "lucide-react",
  Monitor: "lucide-react",
  MapPin: "lucide-react",
};

export function useIcon(name: IconName): React.ComponentType<{ className?: string }> {
  if (!iconCache.has(name)) {
    const IconComponent = dynamic(
      () => import("lucide-react").then((mod) => mod[name] as React.ComponentType<{ className?: string }>),
      { ssr: false }
    );
    iconCache.set(name, IconComponent);
  }
  return iconCache.get(name)!;
}