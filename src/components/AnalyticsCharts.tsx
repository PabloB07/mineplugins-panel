"use client";

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export interface DailyValidation {
  date: string;
  count: number;
  success: number;
  failed: number;
}

export interface LicenseStatusItem {
  status: string;
  count: number;
}

interface AnalyticsChartsProps {
  dailyValidations: DailyValidation[];
  licensesByStatus: LicenseStatusItem[];
  rangeDays?: number;
}

export default function AnalyticsCharts({ dailyValidations, licensesByStatus, rangeDays = 30 }: AnalyticsChartsProps) {
  const COLORS = {
    ACTIVE: "#10B981",
    EXPIRED: "#EF4444",
    SUSPENDED: "#F59E0B",
    REVOKED: "#6B7280",
  };

  const hasValidationData = dailyValidations.some((item) => item.count > 0);
  const hasLicenseStatusData = licensesByStatus.some((item) => item.count > 0);

  const pieData = licensesByStatus
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: item.status,
      value: item.count,
      color: COLORS[item.status as keyof typeof COLORS] || "#6B7280",
    }));

  const chartData = [...dailyValidations];

  return (
    <>
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Validation Trend Chart */}
        <div className="bg-[#111] rounded-xl border border-[#222] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Validation Trend ({rangeDays} Days)</h2>
          {hasValidationData ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                />
                <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
                  labelStyle={{ color: "#F3F4F6" }}
                  itemStyle={{ color: "#F3F4F6" }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Line type="monotone" dataKey="success" stroke="#10B981" strokeWidth={2} dot={false} name="Successful" />
                <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} dot={false} name="Failed" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] rounded-xl border border-dashed border-[#333] flex items-center justify-center text-sm text-gray-400">
              No validation data in the last 30 days
            </div>
          )}
        </div>

        {/* Validation Volume Chart */}
        <div className="bg-[#111] rounded-xl border border-[#222] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Validation Volume</h2>
          {hasValidationData ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                />
                <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
                  labelStyle={{ color: "#F3F4F6" }}
                  itemStyle={{ color: "#F3F4F6" }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Bar dataKey="count" name="Total Validations" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] rounded-xl border border-dashed border-[#333] flex items-center justify-center text-sm text-gray-400">
              No volume to chart yet
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* License Status Pie Chart */}
        <div className="bg-[#111] rounded-xl border border-[#222] p-6 max-w-3xl">
          <h2 className="text-lg font-semibold text-white mb-4">License Distribution</h2>
          {hasLicenseStatusData ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
                  labelStyle={{ color: "#F3F4F6" }}
                  itemStyle={{ color: "#F3F4F6" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] rounded-xl border border-dashed border-[#333] flex items-center justify-center text-sm text-gray-400">
              No license status data available
            </div>
          )}
        </div>
      </div>
    </>
  );
}
