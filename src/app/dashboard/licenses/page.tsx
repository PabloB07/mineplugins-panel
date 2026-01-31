"use client";

import { useState, useEffect } from "react";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  Server, 
  Globe, 
  CheckCircle, 
  XCircle,
  Calendar,
  Zap,
  Activity,
  RefreshCw,
  Shield,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  RotateCcw
} from "lucide-react";

type License = {
  id: string;
  licenseKey: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  lastValidatedAt: Date | null;
  maxActivations: number;
  product: {
    name: string;
    slug: string;
  };
  _count?: {
    activations: number;
  };
  activations: Array<{
    id: string;
    serverId: string;
    serverIp: string | null;
    isActive: boolean;
    lastSeenAt: Date;
    serverVersion: string | null;
    validationCount: number;
  }>;
};

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [renewModal, setRenewModal] = useState<{ open: boolean; licenseId: string; licenseName: string }>({
    open: false,
    licenseId: "",
    licenseName: "",
  });
  const [renewForm, setRenewForm] = useState<{ durationDays: number }>({ durationDays: 365 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const response = await fetch('/api/licenses');
      if (response.ok) {
        const data = await response.json();
        setLicenses(data.licenses || []);
      } else if (response.status === 401) {
        // Redirect to login if unauthorized
        window.location.href = '/login';
      } else {
        console.error('Failed to fetch licenses:', response.statusText);
        setLicenses([]);
      }
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
      setLicenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLicenses();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!renewModal.licenseId) {
        throw new Error('License ID is required');
      }

      const response = await fetch(`/api/dashboard/licenses/${renewModal.licenseId}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationDays: renewForm.durationDays }),
      });

      if (response.ok) {
        await fetchLicenses();
        setRenewModal({ open: false, licenseId: "", licenseName: "" });
        setRenewForm({ durationDays: 365 });
      } else {
        const error = await response.json();
        alert(error.error || 'Renewal failed');
      }
    } catch (error) {
      console.error('Renewal error:', error);
      alert('Renewal failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

   if (loading) {
     return (
       <div className="flex items-center justify-center min-h-[400px]">
         <div className="text-center">
           <RefreshCw className="w-8 h-8 text-green-400 animate-spin mx-auto mb-4" />
           <p className="text-gray-400">Loading your licenses...</p>
         </div>
       </div>
     );
   }

   return (
      <div className="space-y-8 animate-fade-in pb-10">
        {/* Welcome Hero - Gradient Background */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
                Your Licenses
                <button
                  onClick={handleRefresh}
                  className={`text-gray-400 hover:text-white transition-colors ${refreshing ? 'animate-spin' : ''}`}
                  disabled={refreshing}
                >
                  <RefreshCw className="w-6 h-6" />
                </button>
              </h1>
              <p className="text-gray-400 max-w-lg text-lg">
                Manage your TownyFaiths plugin licenses with real-time status updates and server activation details.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                  <Shield className="w-4 h-4 mr-2" />
                  {licenses.filter(l => l.status === "ACTIVE").length} Active Licenses
                </div>
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                  <Server className="w-4 h-4 mr-2" />
                  {licenses.reduce((acc, l) => acc + l.activations.filter(a => a.isActive).length, 0)} Active Servers
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <Link
                href="/buy"
                className="bg-[#22c55e] text-black hover:bg-[#16a34a] px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#22c55e]/20"
              >
                <Zap className="w-5 h-5" />
                Buy New License
              </Link>
            </div>
          </div>
        </div>

       {/* Licenses Grid */}
       {licenses.length === 0 ? (
         <div className="relative bg-[#111] rounded-xl border border-[#222] p-16 text-center overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
           <div className="relative z-10 w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
             <Server className="w-8 h-8 text-gray-500" />
           </div>
           <div className="text-gray-400 mb-4 text-lg">
             You don&apos;t have any licenses yet.
           </div>
           <Link
             href="/buy"
             className="bg-[#22c55e] text-black hover:bg-[#16a34a] px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 inline-block shadow-lg shadow-[#22c55e]/20"
           >
             Purchase Your First License
           </Link>
         </div>
       ) : (
        <div className="grid gap-6">
          {licenses.map((license) => {
            const now = new Date();
            const isExpired = now > new Date(license.expiresAt);
            const daysLeft = Math.ceil(
              (new Date(license.expiresAt).getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            const activeActivations = license.activations.filter(
              (a) => a.isActive
            ).length;

            return (
               <div
                 key={license.id}
                 className="group relative bg-[#111] hover:bg-[#151515] rounded-xl border border-[#222] hover:border-[#22c55e]/50 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-black/20 hover:scale-[1.02] transform"
               >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-400" />
                        {license.product.name}
                      </h3>
                      <p className="text-gray-400 text-sm font-mono mt-1 flex items-center gap-2">
                        {license.licenseKey.substring(0, 20)}...
                        <button
                          onClick={() => copyToClipboard(license.licenseKey, license.id)}
                          className="hover:text-green-400 transition-colors"
                        >
                          {copiedId === license.id ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center gap-1 ${
                          license.status === "ACTIVE" && !isExpired
                            ? "bg-green-500/20 text-green-300 border-green-500/30 animate-pulse"
                            : license.status === "EXPIRED" || isExpired
                            ? "bg-red-500/20 text-red-300 border-red-500/30"
                            : license.status === "SUSPENDED"
                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                             : "bg-gray-700 text-gray-300 border-[#333]"
                        }`}
                      >
                        {license.status === "ACTIVE" && !isExpired && <CheckCircle className="w-3 h-3" />}
                        {license.status === "EXPIRED" || isExpired && <AlertTriangle className="w-3 h-3" />}
                        {isExpired ? "EXPIRED" : license.status}
                      </span>
                      {isExpired && daysLeft > -30 && (
                        <span className="text-xs text-yellow-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Grace period
                        </span>
                      )}
                    </div>
                  </div>

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                   <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all group">
                     <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                       <Calendar className="w-3 h-3" />
                       Created
                     </div>
                     <div className="text-white font-medium group-hover:text-[#22c55e] transition-colors">
                       {new Date(license.createdAt).toLocaleDateString()}
                     </div>
                   </div>
                   <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all group">
                     <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                       <Clock className="w-3 h-3" />
                       Expires
                     </div>
                     <div
                       className={`font-medium transition-colors ${
                         isExpired ? "text-red-400" : "text-white group-hover:text-[#22c55e]"
                       }`}
                     >
                       {new Date(license.expiresAt).toLocaleDateString()}
                       {!isExpired && daysLeft <= 30 && (
                         <span className="text-yellow-400 ml-2 text-sm animate-pulse">
                           ({daysLeft} days left)
                         </span>
                       )}
                     </div>
                   </div>
                   <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all group">
                     <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                       <Server className="w-3 h-3" />
                       Activations
                     </div>
                     <div className="text-white font-medium group-hover:text-[#22c55e] transition-colors">
                       {activeActivations} / {license.maxActivations}
                       {activeActivations === license.maxActivations && (
                         <span className="text-xs text-yellow-400 ml-1">●</span>
                       )}
                     </div>
                   </div>
                   <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all group">
                     <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                       <Activity className="w-3 h-3" />
                       Last Validated
                     </div>
                     <div className="text-white font-medium group-hover:text-[#22c55e] transition-colors">
                       {license.lastValidatedAt
                         ? new Date(
                             license.lastValidatedAt
                           ).toLocaleDateString()
                         : "Never"}
                     </div>
                   </div>
                   </div>

                  {/* Server Activations */}
                  {license.activations.length > 0 && (
                    <div className="border-t border-[#222] pt-4 mt-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                        <Server className="w-4 h-4" />
                        Active Servers ({license.activations.length})
                      </div>
                      <div className="space-y-3">
                        {license.activations.slice(0, 3).map((activation) => (
                            <div
                              key={activation.id}
                              className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all hover:scale-[1.02] transform"
                            >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {activation.isActive ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-gray-500" />
                                )}
                                <div>
                                  <div className="text-white text-sm font-mono">
                                    Server {activation.serverId.substring(0, 12)}...
                                  </div>
                                  {activation.serverIp && (
                                    <div className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                                      <Globe className="w-3 h-3" />
                                      {activation.serverIp}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                activation.isActive
                                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                   : "bg-gray-700/50 text-gray-300 border-[#333]"
                              }`}>
                                {activation.isActive ? "Active" : "Inactive"}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              {activation.serverVersion && (
                                <div className="flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  v{activation.serverVersion}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                {activation.validationCount} validations
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(activation.lastSeenAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                        {license.activations.length > 3 && (
                          <div className="text-center">
                            <Link
                              href={`/dashboard/licenses/${license.id}`}
                              className="text-gray-400 hover:text-green-400 text-sm inline-flex items-center gap-1 transition-colors"
                            >
                              +{license.activations.length - 3} more servers →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                  <div className="bg-[#151515] px-6 py-3 flex justify-between items-center border-t border-[#222]">
                    <div className="flex gap-3">
                      <Link
                        href={`/dashboard/licenses/${license.id}`}
                        className="text-[#22c55e] hover:text-[#16a34a] text-sm font-medium transition-all inline-flex items-center gap-1 hover:bg-[#22c55e]/10 px-3 py-1 rounded-lg"
                      >
                        View Details →
                      </Link>
                      <button
                        onClick={() => copyToClipboard(license.licenseKey, `footer-${license.id}`)}
                        className="text-gray-400 hover:text-white text-sm transition-all px-3 py-1 rounded-lg hover:bg-[#333] inline-flex items-center gap-1"
                      >
                        {copiedId === `footer-${license.id}` ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy License
                          </>
                        )}
                      </button>
                      {license.licenseKey.startsWith('eyJ') && (
                        <button
                          onClick={() => setRenewModal({ 
                            open: true, 
                            licenseId: license.id, 
                            licenseName: license.product.name 
                          })}
                          className="text-[#22c55e] hover:text-[#16a34a] text-sm transition-all px-3 py-1 rounded-lg hover:bg-[#22c55e]/10 inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Renew
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {license.licenseKey.startsWith('eyJ') ? 'JWT License' : 'Legacy License'}
                      </span>
                      {isExpired && (
                        <span className="text-xs text-red-400">Expired</span>
                      )}
                    </div>
                  </div>
              </div>
            );
          })}
         </div>
       )}

        {/* Renewal Modal */}
        {renewModal.open && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-[#222] p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-semibold text-white mb-4">
                Renew License - {renewModal.licenseName}
              </h3>
              
              <form onSubmit={handleRenewal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Renewal Duration
                  </label>
                  <select
                    value={renewForm.durationDays}
                    onChange={(e) => setRenewForm({ ...renewForm, durationDays: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#22c55e] transition-colors"
                  >
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>6 months</option>
                    <option value={365}>1 year</option>
                    <option value={730}>2 years</option>
                  </select>
                </div>

                <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#22c55e] mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-[#22c55e]">
                      <p className="font-semibold mb-1">Renewal Information:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Extension will be added to current expiry date</li>
                        <li>• All activations will remain active</li>
                        <li>• New license key will be generated</li>
                        <li>• Only JWT licenses can be renewed</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRenewModal({ open: false, licenseId: "", licenseName: "" })}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a] disabled:bg-gray-700 disabled:cursor-not-allowed py-2 px-4 rounded-lg font-bold transition-all hover:shadow-lg hover:shadow-[#22c55e]/20"
                  >
                    {submitting ? 'Processing...' : `Renew ${renewForm.durationDays} days`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
     </div>
   );
 }
