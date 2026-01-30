"use client";

import { prisma } from "@/lib/prisma";
import { formatCLP } from "@/lib/pricing";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Download,
  Calendar
} from "lucide-react";

export default function AdminAnalyticsPage() {
  // TODO: Implement analytics with server-side rendering
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-4">Analytics Dashboard</h1>
        <p className="text-gray-400 mb-8 text-lg">Analytics are temporarily unavailable while we update the system.</p>
        <div className="inline-flex items-center gap-3 bg-blue-500/20 text-blue-400 px-6 py-3 rounded-xl border border-blue-500/30">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent mr-3"></div>
          Working on improvements...
        </div>
      </div>
    </div>
  );
}