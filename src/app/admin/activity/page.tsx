"use client";

import { useEffect, useState } from "react";
import { Activity, Shield, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";

interface Activity {
  id: string;
  action: string;
  details?: string;
  createdAt: string;
  admin: {
    id: string;
    email: string;
    name: string | null;
  };
  targetUser?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchActivities();
  }, [filter, pagination.page]);

  async function fetchActivities() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("action", filter);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      
      const url = `/api/admin/activity?${params.toString()}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        // Fallback for now since schema needs to be updated
        setActivities([]);
        setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }));
      } else {
        const data = await res.json();
        setActivities(data.activities || []);
        setPagination(prev => ({
          ...prev,
          total: data.total || 0,
          totalPages: data.totalPages || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "USER_ROLE_UPDATE":
        return <Shield className="w-4 h-4 text-yellow-400" />;
      case "LICENSE_CREATED":
      case "LICENSE_REVOKED":
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case "ORDER_FIXED":
        return <Activity className="w-4 h-4 text-green-400" />;
      case "LOGIN":
      case "LOGOUT":
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "USER_ROLE_UPDATE":
        return "text-yellow-300";
      case "LICENSE_CREATED":
        return "text-blue-300";
      case "ORDER_FIXED":
        return "text-green-300";
      case "LICENSE_REVOKED":
        return "text-red-300";
      default:
        return "text-gray-300";
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Activity className="w-8 h-8 text-purple-400" />
          Admin Activity Log
        </h1>
        <p className="text-gray-400 mt-1">Track all administrative actions</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-gray-400 text-sm">Filter by action:</span>
          <div className="flex gap-2">
            {["all", "USER_ROLE_UPDATE", "LICENSE_CREATED", "LICENSE_REVOKED", "ORDER_FIXED"].map(
              (action) => (
                <button
                  key={action}
                  onClick={() => setFilter(action)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === action
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {action === "all" ? "All" : action.replace(/_/g, " ")}
                </button>
              )
            )}
          </div>
          <div className="text-sm text-gray-400 bg-gray-700/50 px-3 py-1.5 rounded-lg">
            {pagination.total} total activities
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">No Activities Found</h3>
              <p className="text-gray-400">
                {filter === "all" 
                  ? "No admin activities have been recorded yet."
                  : `No ${filter.replace(/_/g, " ").toLowerCase()} activities found.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getActionIcon(activity.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`font-medium ${getActionColor(activity.action)}`}>
                        {activity.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    {activity.details && (
                      <p className="text-gray-300 text-sm mb-2">{activity.details}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <span>By:</span>
                        <span className="text-gray-400">
                          {activity.admin.name || activity.admin.email}
                        </span>
                      </div>
                      
                      {activity.targetUser && (
                        <div className="flex items-center gap-1">
                          <span>Target:</span>
                          <span className="text-gray-400">
                            {activity.targetUser.name || activity.targetUser.email}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} activities
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === pagination.page;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`px-3 py-1 text-sm rounded ${
                        isActive
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {pagination.totalPages > 5 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
                      className={`px-3 py-1 text-sm rounded ${
                        pagination.page === pagination.totalPages
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {pagination.totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}