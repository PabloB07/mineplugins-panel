"use client";

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DailyValidation {
  date: string;
  count: number;
  success: number;
  failed: number;
}

interface LicenseStatusItem {
  status: string;
  _count: number;
}

interface AnalyticsChartsProps {
  dailyValidations: DailyValidation[];
  licensesByStatus: LicenseStatusItem[];
}

export default function AnalyticsCharts({ dailyValidations, licensesByStatus }: AnalyticsChartsProps) {
  const COLORS = {
    ACTIVE: "#10B981",
    EXPIRED: "#EF4444", 
    SUSPENDED: "#F59E0B",
    REVOKED: "#6B7280"
  };

  return (
    <>
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Validation Trend Chart */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Validation Trend (30 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyValidations.reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
        </div>

        {/* License Status Pie Chart */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">License Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={licensesByStatus.map((item) => ({
                  name: item.status,
                  value: item._count,
                  color: COLORS[item.status as keyof typeof COLORS] || "#6B7280"
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {licensesByStatus.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.status as keyof typeof COLORS] || "#6B7280"} 
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
        </div>
      </div>
    </>
  );
}