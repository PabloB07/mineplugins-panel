import { prisma } from "@/lib/prisma";
import { formatCLP } from "@/lib/pricing";
import AnalyticsCharts, { DailyValidation, LicenseStatusItem } from "@/components/AnalyticsCharts";
import Link from "next/link";
import {
  BarChart3,
  Download,
  Activity,
  CheckCircle,
  XCircle,
  Key,
  ShoppingCart,
  Users,
} from "lucide-react";
import { LicenseStatus } from "@prisma/client";

function getStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const { range } = await searchParams;
  const parsedRange = Number(range);
  const selectedRangeDays = [7, 30, 90].includes(parsedRange) ? parsedRange : 30;

  const now = new Date();
  const rangeStart = getStartOfDay(new Date(now.getTime() - (selectedRangeDays - 1) * 24 * 60 * 60 * 1000));

  const [
    totalUsers,
    totalLicenses,
    activeLicenses,
    completedOrders,
    revenue,
    downloadsInRange,
    validationsInRange,
    successfulInRange,
    failedInRange,
    validationLogsInRange,
    groupedLicenses,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.license.count(),
    prisma.license.count({ where: { status: "ACTIVE" } }),
    prisma.order.count({
      where: {
        status: "COMPLETED",
        createdAt: { gte: rangeStart },
      },
    }),
    prisma.order.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: { gte: rangeStart },
      },
      _sum: { total: true },
    }),
    prisma.download.count({
      where: { downloadedAt: { gte: rangeStart } },
    }),
    prisma.validationLog.count({
      where: { createdAt: { gte: rangeStart } },
    }),
    prisma.validationLog.count({
      where: { createdAt: { gte: rangeStart }, isValid: true },
    }),
    prisma.validationLog.count({
      where: { createdAt: { gte: rangeStart }, isValid: false },
    }),
    prisma.validationLog.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true, isValid: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.license.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const byDay = new Map<string, DailyValidation>();
  for (let i = 0; i < selectedRangeDays; i += 1) {
    const day = new Date(rangeStart.getTime() + i * 24 * 60 * 60 * 1000);
    const key = formatDateKey(day);
    byDay.set(key, { date: key, count: 0, success: 0, failed: 0 });
  }

  for (const row of validationLogsInRange) {
    const key = formatDateKey(row.createdAt);
    const bucket = byDay.get(key);
    if (!bucket) continue;
    bucket.count += 1;
    if (row.isValid) {
      bucket.success += 1;
    } else {
      bucket.failed += 1;
    }
  }

  const dailyValidations = Array.from(byDay.values());
  const licenseStatusMap = new Map<LicenseStatus, number>(
    groupedLicenses.map((row) => [row.status, row._count._all]),
  );
  const licensesByStatus: LicenseStatusItem[] = [
    { status: "ACTIVE", count: licenseStatusMap.get("ACTIVE") || 0 },
    { status: "EXPIRED", count: licenseStatusMap.get("EXPIRED") || 0 },
    { status: "SUSPENDED", count: licenseStatusMap.get("SUSPENDED") || 0 },
    { status: "REVOKED", count: licenseStatusMap.get("REVOKED") || 0 },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="rounded-2xl border border-[#222] bg-gradient-to-r from-[#111] to-[#0a0a0a] p-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[#f59e0b]" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 mt-2">
              Revenue, validations, licenses and downloads from the selected range.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[7, 30, 90].map((days) => {
              const active = selectedRangeDays === days;
              return (
                <Link
                  key={days}
                  href={`/admin/analytics?range=${days}`}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${active
                    ? "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40"
                    : "bg-[#121212] text-gray-400 border-[#2a2a2a] hover:text-white hover:border-[#444]"
                    }`}
                >
                  {days}d
                </Link>
              );
            })}
            <div className="text-sm text-gray-500 ml-2">
              Updated: {now.toLocaleString("en-US")}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Completed Orders ({selectedRangeDays}d)
          </div>
          <div className="text-3xl font-bold text-white">{completedOrders}</div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Customers
          </div>
          <div className="text-3xl font-bold text-white">{totalUsers}</div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
            <Key className="w-4 h-4" />
            Active Licenses
          </div>
          <div className="text-3xl font-bold text-white">{activeLicenses}</div>
          <div className="text-xs text-gray-500 mt-1">of {totalLicenses} total</div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Downloads ({selectedRangeDays}d)
          </div>
          <div className="text-3xl font-bold text-white">{downloadsInRange}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-2">Total Revenue ({selectedRangeDays}d)</div>
          <div className="text-4xl font-bold text-white">${(revenue._sum.total || 0).toLocaleString("es-CL", { maximumFractionDigits: 0 })} CLP</div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-lg p-3">
              <div className="text-gray-500 mb-1 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Validations ({selectedRangeDays}d)
              </div>
              <div className="text-white font-semibold">{validationsInRange}</div>
            </div>
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-lg p-3">
              <div className="text-gray-500 mb-1 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Successful
              </div>
              <div className="text-green-400 font-semibold">{successfulInRange}</div>
            </div>
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-lg p-3">
              <div className="text-gray-500 mb-1 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                Failed
              </div>
              <div className="text-red-400 font-semibold">{failedInRange}</div>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">License Status</h2>
          <div className="space-y-3">
            {licensesByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{item.status}</span>
                <span className="text-white font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnalyticsCharts
        dailyValidations={dailyValidations}
        licensesByStatus={licensesByStatus}
        rangeDays={selectedRangeDays}
      />
    </div>
  );
}
