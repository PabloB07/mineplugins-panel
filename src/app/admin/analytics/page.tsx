import { prisma } from "@/lib/prisma";
import { formatCLP } from "@/lib/pricing";
import { TrendingUp, TrendingDown, Users, CreditCard, Activity, AlertCircle, CheckCircle, XCircle } from "lucide-react";

type LicenseStatusItem = {
  status: string;
  _count: number;
};

type FailureReasonItem = {
  failureReason: string | null;
  _count: number;
};

export default async function AdminAnalyticsPage() {
  // Get date range for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get validation stats
  const [
    totalValidations,
    successfulValidations,
    failedValidations,
    uniqueServers,
  ] = await Promise.all([
    prisma.validationLog.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.validationLog.count({
      where: { createdAt: { gte: thirtyDaysAgo }, isValid: true },
    }),
    prisma.validationLog.count({
      where: { createdAt: { gte: thirtyDaysAgo }, isValid: false },
    }),
    prisma.validationLog.groupBy({
      by: ["serverId"],
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  // Get license stats
  const licensesByStatus = await prisma.license.groupBy({
    by: ["status"],
    _count: true,
  });

  // Get top failure reasons
  const failureReasons = await prisma.validationLog.groupBy({
    by: ["failureReason"],
    where: {
      createdAt: { gte: thirtyDaysAgo },
      isValid: false,
      failureReason: { not: null },
    },
    _count: true,
    orderBy: { _count: { failureReason: "desc" } },
    take: 10,
  });

  // Get daily validations for chart
  const rawDailyValidations = await prisma.$queryRaw<
    Array<{ date: string; count: bigint; success: bigint }>
  >`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count,
      SUM(CASE WHEN is_valid = true THEN 1 ELSE 0 END) as success
    FROM validation_logs
    WHERE created_at >= ${thirtyDaysAgo}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `;

  const dailyValidations = rawDailyValidations.map((item: { date: string; count: bigint; success: bigint }) => ({
    ...item,
    count: Number(item.count),
    success: Number(item.success),
    failed: Number(item.count) - Number(item.success)
  }));

  // Get revenue stats
  const revenueStats = await prisma.order.aggregate({
    where: {
      status: "COMPLETED",
      paidAt: { gte: thirtyDaysAgo },
    },
    _sum: { total: true },
    _count: true,
  });

  const successRate =
    totalValidations > 0
      ? ((successfulValidations / totalValidations) * 100).toFixed(1)
      : "0";

  // Export functions
  function exportData(type: 'validations' | 'revenue') {
    if (type === 'validations') {
      // Export daily validations data
      const headers = ['Date', 'Total Validations', 'Successful', 'Failed', 'Success Rate (%)'];
      const csvData = dailyValidations.map((day: { date: string; count: number; success: number; failed: number }) => [
        new Date(day.date).toLocaleDateString(),
        day.count.toString(),
        day.success.toString(),
        day.failed.toString(),
        day.count > 0 ? ((day.success / day.count) * 100).toFixed(1) : '0'
      ]);
      
      downloadCSV([headers, ...csvData], 'validations-report.csv');
    } else if (type === 'revenue') {
      // Export revenue summary
      const revenueData = [
        ['Metric', 'Value', 'Period'],
        ['Total Revenue (CLP)', formatCLP(revenueStats._sum.total || 0), 'Last 30 days'],
        ['Completed Orders', revenueStats._count.toString(), 'Last 30 days'],
        ['Total Validations', totalValidations.toString(), 'Last 30 days'],
        ['Success Rate (%)', successRate, 'Last 30 days'],
        ['Unique Servers', uniqueServers.length.toString(), 'Last 30 days'],
      ];
      
      downloadCSV(revenueData, 'revenue-summary.csv');
    }
  }

  function downloadCSV(data: string[][], filename: string) {
    const csv = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Last 30 days performance overview</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => exportData('validations')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Validations
          </button>
          <button
            onClick={() => exportData('revenue')}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Revenue
          </button>
          <div className="text-sm text-gray-400">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30 rounded-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full">All time</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {totalValidations.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">Total Validations</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-700/30 rounded-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              {Number(successRate) >= 90 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-yellow-400" />
              )}
              <span className={`text-xs px-2 py-1 rounded-full ${
                Number(successRate) >= 90 
                  ? "text-green-400 bg-green-900/30" 
                  : Number(successRate) >= 70
                  ? "text-yellow-400 bg-yellow-900/30"
                  : "text-red-400 bg-red-900/30"
              }`}>
                {Number(successRate) >= 90 ? "Excellent" : Number(successRate) >= 70 ? "Good" : "Needs Attention"}
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{successRate}%</div>
            <div className="text-gray-400 text-sm">Success Rate</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-700/30 rounded-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded-full">Active</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {uniqueServers.length}
            </div>
            <div className="text-gray-400 text-sm">Unique Servers</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border border-yellow-700/30 rounded-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="w-5 h-5 text-yellow-400" />
              <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-1 rounded-full">Revenue</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {formatCLP(revenueStats._sum.total || 0)}
            </div>
            <div className="text-gray-400 text-sm">Total Revenue</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Validation Trend Summary */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Recent Validation Trend
            </h2>
            <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">Last 7 days</span>
          </div>
          <div className="space-y-3">
            {dailyValidations.slice(0, 7).reverse().map((day, index) => {
              const rate = day.count > 0 ? ((day.success / day.count) * 100).toFixed(0) : "0";
              const isGood = Number(rate) >= 90;
              
              return (
                <div key={day.date} className="group hover:bg-gray-700/30 -mx-2 px-2 py-2 rounded transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-sm font-medium text-green-400">{day.success}</span>
                      </div>
                      {day.failed > 0 && (
                        <div className="flex items-center gap-1.5">
                          <XCircle className="w-3 h-3 text-red-400" />
                          <span className="text-sm font-medium text-red-400">{day.failed}</span>
                        </div>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isGood 
                          ? "bg-green-900/30 text-green-400" 
                          : "bg-yellow-900/30 text-yellow-400"
                      }`}>
                        {rate}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isGood ? "bg-green-500" : "bg-yellow-500"
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* License Status Distribution */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              License Distribution
            </h2>
            <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">All time</span>
          </div>
          <div className="space-y-4">
            {licensesByStatus.map((item: LicenseStatusItem) => {
              const statusInfo: Record<string, { color: string; icon: React.ReactNode; bgClass: string }> = {
                ACTIVE: { 
                  color: "bg-green-500", 
                  icon: <CheckCircle className="w-4 h-4 text-green-400" />,
                  bgClass: "bg-green-900/20 border-green-700/30"
                },
                EXPIRED: { 
                  color: "bg-red-500", 
                  icon: <XCircle className="w-4 h-4 text-red-400" />,
                  bgClass: "bg-red-900/20 border-red-700/30"
                },
                SUSPENDED: { 
                  color: "bg-yellow-500", 
                  icon: <AlertCircle className="w-4 h-4 text-yellow-400" />,
                  bgClass: "bg-yellow-900/20 border-yellow-700/30"
                },
                REVOKED: { 
                  color: "bg-gray-500", 
                  icon: <XCircle className="w-4 h-4 text-gray-400" />,
                  bgClass: "bg-gray-900/20 border-gray-700/30"
                },
              };
              
              const info = statusInfo[item.status] || statusInfo.REVOKED;
              const totalLicenses = licensesByStatus.reduce(
                (acc: number, i: LicenseStatusItem) => acc + i._count,
                0
              );
              const percentage = totalLicenses > 0 ? ((item._count / totalLicenses) * 100).toFixed(1) : "0";

              return (
                <div key={item.status} className={`p-3 rounded-lg border ${info.bgClass}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {info.icon}
                      <span className="text-sm font-medium text-white">{item.status}</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {item._count} 
                      <span className="text-gray-400 font-normal ml-1">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`${info.color} h-2 rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-r from-green-900/20 to-green-800/10 border border-green-700/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold text-green-400">
              {successfulValidations.toLocaleString()}
            </span>
          </div>
          <div className="text-gray-300 text-sm font-medium">Successful Validations</div>
          <div className="text-xs text-gray-500 mt-1">
            {totalValidations > 0 ? `${((successfulValidations / totalValidations) * 100).toFixed(1)}% of total` : '0%'}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-900/20 to-red-800/10 border border-red-700/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <XCircle className="w-8 h-8 text-red-400" />
            <span className="text-2xl font-bold text-red-400">
              {failedValidations.toLocaleString()}
            </span>
          </div>
          <div className="text-gray-300 text-sm font-medium">Failed Validations</div>
          <div className="text-xs text-gray-500 mt-1">
            {totalValidations > 0 ? `${((failedValidations / totalValidations) * 100).toFixed(1)}% of total` : '0%'}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 border border-blue-700/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <CreditCard className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-blue-400">
              {revenueStats._count}
            </span>
          </div>
          <div className="text-gray-300 text-sm font-medium">Completed Orders</div>
          <div className="text-xs text-gray-500 mt-1">
            Revenue: {formatCLP(revenueStats._sum.total || 0)}
          </div>
        </div>
      </div>

      {/* Top Failure Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Top Failure Reasons
            </h2>
            <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">Last 30 days</span>
          </div>
          {failureReasons.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-400">No failures recorded in the last 30 days! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {failureReasons.map((reason: FailureReasonItem, index: number) => (
                <div
                  key={reason.failureReason || index}
                  className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <span className="text-gray-300 text-sm font-medium">
                    {reason.failureReason || "Unknown"}
                  </span>
                  <span className="text-red-400 text-sm font-bold bg-red-900/20 px-2 py-1 rounded">
                    {reason._count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Validations Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Daily Validation History
            </h2>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Successful
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {dailyValidations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      No validation data yet
                    </td>
                  </tr>
                ) : (
                  dailyValidations.map((day: { date: string; count: number; success: number; failed: number }) => {
                    const total = day.count;
                    const success = day.success;
                    const rate = total > 0 ? ((success / total) * 100).toFixed(1) : "0";

                    return (
                      <tr key={day.date} className="hover:bg-gray-700/30">
                        <td className="px-6 py-3 text-gray-300 text-sm">
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-gray-300 text-sm">{total}</td>
                        <td className="px-6 py-3 text-green-400 text-sm">
                          {success}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`text-sm font-medium ${
                              Number(rate) >= 90
                                ? "text-green-400"
                                : Number(rate) >= 70
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                          >
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}