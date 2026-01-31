"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Server, 
  Globe, 
  Activity, 
  Calendar, 
  Shield, 
  Monitor, 
  Zap,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  ArrowRight,
  Download
} from "lucide-react";

interface License {
  id: string;
  licenseKey: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  lastValidatedAt: string | null;
  maxActivations: number;
  notes: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
  };
  activations: Array<{
    id: string;
    serverId: string;
    macAddress: string | null;
    hardwareHash: string | null;
    networkSignature: string | null;
    serverIp: string | null;
    serverVersion: string | null;
    minecraftVersion: string | null;
    isActive: boolean;
    firstSeenAt: string;
    lastSeenAt: string;
    validationCount: number;
  }>;
}

export default function LicenseDetailPage() {
  const params = useParams();
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchLicense() {
      try {
        const res = await fetch(`/api/licenses/${params.id}`);
        const data = await res.json();
 
        if (!res.ok) {
          throw new Error(data.message || "Failed to load license");
        }
 
        setLicense(data.license);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
 
    fetchLicense();
  }, [params.id]);

  const copyLicenseKey = async () => {
    if (!license) return;
    await navigator.clipboard.writeText(license.licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !license) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
        <div className="text-red-400 mb-4">{error || "License not found"}</div>
        <Link
          href="/dashboard/licenses"
          className="text-blue-400 hover:text-blue-300"
        >
          Back to Licenses
        </Link>
      </div>
    );
  }

  const isExpired = new Date() > new Date(license.expiresAt);
  const daysLeft = Math.ceil(
    (new Date(license.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const activeActivations = license.activations.filter((a) => a.isActive).length;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Hero - Gradient Background */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/dashboard/licenses"
                className="text-gray-400 hover:text-[#22c55e] transition-colors flex items-center gap-2"
              >
                ← Back to Licenses
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
              {license.product.name}
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              Complete license management with server activations and detailed information.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                <Shield className="w-4 h-4 mr-2" />
                {isExpired ? "EXPIRED" : license.status}
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <Server className="w-4 h-4 mr-2" />
                {activeActivations} / {license.maxActivations} Activations
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                {!isExpired && daysLeft <= 30 ? `${daysLeft} days left` : "Active"}
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <button
              onClick={copyLicenseKey}
              className="bg-[#22c55e] text-black hover:bg-[#16a34a] px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#22c55e]/20"
            >
              {copied ? "✓ Copied" : <><Copy className="w-4 h-4" /> Copy License Key</>}
            </button>
          </div>
        </div>
      </div>

      {/* License Key Card */}
      <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden hover:border-[#22c55e]/20 transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e] border border-[#22c55e]/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">License Key</h2>
              <p className="text-gray-400 text-sm">Your unique license identifier</p>
            </div>
          </div>
          
          <div className="bg-[#0a0a0a]/50 rounded-lg p-4 border border-[#222] hover:border-[#22c55e]/30 transition-all">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <code className="text-[#22c55e] font-mono text-lg break-all">
                  {license.licenseKey}
                </code>
              </div>
              <button
                onClick={copyLicenseKey}
                className="bg-[#22c55e] text-black hover:bg-[#16a34a] px-4 py-2 rounded-lg text-sm font-bold transition-all hover:shadow-lg hover:shadow-[#22c55e]/20 ml-4"
              >
                {copied ? "✓ Copied" : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* License Information Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111] rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all group">
          <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Created
          </div>
          <div className="text-white font-medium group-hover:text-[#22c55e] transition-colors">
            {new Date(license.createdAt).toLocaleDateString()}
          </div>
        </div>
        
        <div className="bg-[#111] rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all group">
          <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Expires
          </div>
          <div className={`font-medium transition-colors ${
            isExpired ? "text-red-400" : "text-white group-hover:text-[#22c55e]"
          }`}>
            {new Date(license.expiresAt).toLocaleDateString()}
            {!isExpired && daysLeft <= 30 && (
              <span className="text-yellow-400 ml-2 text-sm animate-pulse">
                ({daysLeft} days left)
              </span>
            )}
          </div>
        </div>
        
        <div className="bg-[#111] rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all group">
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
        
        <div className="bg-[#111] rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all group">
          <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Last Validated
          </div>
          <div className="text-white font-medium group-hover:text-[#22c55e] transition-colors">
            {license.lastValidatedAt
              ? new Date(license.lastValidatedAt).toLocaleDateString()
              : "Never"}
          </div>
        </div>
      </div>

      {/* Server Activations */}
      <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden hover:border-[#22c55e]/20 transition-all duration-300">
        <div className="px-6 py-5 border-b border-[#222] bg-[#151515]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-400" />
                Server Activations
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Servers that have activated this license ({license.activations.length} total)
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-[#22c55e]">
                <CheckCircle className="w-4 h-4" />
                <span>{license.activations.filter(a => a.isActive).length} Active</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <XCircle className="w-4 h-4" />
                <span>{license.activations.filter(a => !a.isActive).length} Inactive</span>
              </div>
            </div>
          </div>
        </div>

        {license.activations.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Server className="w-8 h-8 text-gray-500" />
            </div>
            <div className="text-gray-400 mb-2">No server activations yet</div>
            <p className="text-gray-500 text-sm">
              Use the license key above in your Minecraft server to activate
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#222]">
            {license.activations.map((activation) => (
              <div key={activation.id} className="p-6 hover:bg-[#151515]/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activation.isActive 
                        ? "bg-[#22c55e]/20 border border-[#22c55e]/30" 
                        : "bg-gray-700/50 border border-[#333]"
                    }`}>
                      {activation.isActive ? (
                        <CheckCircle className="w-5 h-5 text-[#22c55e]" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        Server {activation.serverId.substring(0, 12)}...
                      </div>
                      <div className="text-sm font-mono text-gray-400">
                        ID: {activation.serverId}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      activation.isActive
                        ? "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30"
                        : "bg-gray-700/50 text-gray-400 border-[#333]"
                    }`}
                  >
                    {activation.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                {/* Server Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-13">
                  {/* IP Address */}
                  {activation.serverIp && (
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Globe className="w-3 h-3" />
                        IP Address
                      </div>
                      <div className="font-mono text-white text-sm">
                        {activation.serverIp}
                      </div>
                    </div>
                  )}

                  {/* Server Version */}
                  {activation.serverVersion && (
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Zap className="w-3 h-3" />
                        Plugin Version
                      </div>
                      <div className="text-white text-sm">
                        v{activation.serverVersion}
                      </div>
                    </div>
                  )}

                  {/* Minecraft Version */}
                  {activation.minecraftVersion && (
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Monitor className="w-3 h-3" />
                        Minecraft Version
                      </div>
                      <div className="text-white text-sm">
                        {activation.minecraftVersion}
                      </div>
                    </div>
                  )}

                  {/* MAC Address */}
                  {activation.macAddress && (
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Shield className="w-3 h-3" />
                        MAC Address
                      </div>
                      <div className="font-mono text-white text-sm">
                        {activation.macAddress}
                      </div>
                    </div>
                  )}

                  {/* Hardware Hash */}
                  {activation.hardwareHash && (
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Server className="w-3 h-3" />
                        Hardware ID
                      </div>
                      <div className="font-mono text-white text-sm">
                        {activation.hardwareHash.substring(0, 12)}...
                      </div>
                    </div>
                  )}

                  {/* Validation Count */}
                  <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#222] hover:border-[#22c55e]/30 transition-all">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <Activity className="w-3 h-3" />
                      Validations
                    </div>
                    <div className="text-white text-sm">
                      {activation.validationCount} times
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-4 pt-4 border-t border-[#222]">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>First seen: {new Date(activation.firstSeenAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Last seen: {new Date(activation.lastSeenAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden hover:border-[#22c55e]/20 transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Setup Instructions</h2>
              <p className="text-gray-400 text-sm">Follow these steps to activate your license</p>
            </div>
          </div>
          
          <div className="bg-[#0a0a0a]/50 rounded-lg p-6 border border-[#222]">
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full flex items-center justify-center text-[#22c55e] font-bold text-sm">
                  1
                </div>
                <div>
                  <div className="font-medium text-white mb-1">Download TownyFaiths Plugin</div>
                  <div className="text-gray-400 text-sm">Get the latest version from the Downloads page</div>
                </div>
              </li>
              
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full flex items-center justify-center text-[#22c55e] font-bold text-sm">
                  2
                </div>
                <div>
                  <div className="font-medium text-white mb-1">Install Plugin</div>
                  <div className="text-gray-400 text-sm">Place the .jar file in your server&apos;s plugins folder</div>
                </div>
              </li>
              
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full flex items-center justify-center text-[#22c55e] font-bold text-sm">
                  3
                </div>
                <div>
                  <div className="font-medium text-white mb-1">Start Server</div>
                  <div className="text-gray-400 text-sm">Start your server to generate config files</div>
                </div>
              </li>
              
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full flex items-center justify-center text-[#22c55e] font-bold text-sm">
                  4
                </div>
                <div>
                  <div className="font-medium text-white mb-1">Configure License</div>
                  <div className="text-gray-400 text-sm">
                    Open <code className="bg-[#111] px-2 py-1 rounded border border-[#222] font-mono">plugins/TownyFaiths/config.yml</code> and set:
                  </div>
                  <div className="bg-[#111] rounded-lg p-3 border border-[#222] mt-2 font-mono text-sm text-gray-300">
                    license.key: {license.licenseKey.substring(0, 20)}...
                  </div>
                </div>
              </li>
              
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full flex items-center justify-center text-[#22c55e] font-bold text-sm">
                  5
                </div>
                <div>
                  <div className="font-medium text-white mb-1">Restart Server</div>
                  <div className="text-gray-400 text-sm">
                    Restart your server or run <code className="bg-[#111] px-2 py-1 rounded border border-[#222] font-mono">/license revalidate</code> to activate
                  </div>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}