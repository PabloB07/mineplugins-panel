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
  XCircle
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
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
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
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/dashboard/licenses"
          className="text-gray-400 hover:text-white"
        >
          &larr; Back to Licenses
        </Link>
      </div>

      {/* License Header */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{license.product.name}</h1>
            <p className="text-gray-400 mt-1">License Details</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              license.status === "ACTIVE" && !isExpired
                ? "bg-green-900 text-green-300"
                : license.status === "EXPIRED" || isExpired
                ? "bg-red-900 text-red-300"
                : license.status === "SUSPENDED"
                ? "bg-yellow-900 text-yellow-300"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            {isExpired ? "EXPIRED" : license.status}
          </span>
        </div>

        {/* License Key */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">License Key</div>
              <code className="text-green-400 font-mono text-lg break-all">
                {license.licenseKey}
              </code>
            </div>
            <button
              onClick={copyLicenseKey}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* License Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-gray-400 text-sm">Created</div>
            <div className="text-white text-lg">
              {new Date(license.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Expires</div>
            <div className={isExpired ? "text-red-400 text-lg" : "text-white text-lg"}>
              {new Date(license.expiresAt).toLocaleDateString()}
              {!isExpired && daysLeft <= 30 && (
                <span className="text-yellow-400 text-sm ml-2">
                  ({daysLeft} days left)
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Activations</div>
            <div className="text-white text-lg">
              {activeActivations} / {license.maxActivations}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Last Validated</div>
            <div className="text-white text-lg">
              {license.lastValidatedAt
                ? new Date(license.lastValidatedAt).toLocaleDateString()
                : "Never"}
            </div>
          </div>
        </div>
      </div>

      {/* Server Activations */}
      <div className="bg-[#111] rounded-xl border border-[#222] shadow-xl">
        <div className="px-6 py-5 border-b border-[#222] bg-gradient-to-r from-[#111] to-[#151515]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-green-400" />
                Server Activations
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Servers that have activated this license ({license.activations.length} total)
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-green-400">
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
                        ? "bg-green-500/20 border border-green-500/30" 
                        : "bg-gray-700/50 border border-gray-600"
                    }`}>
                      {activation.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
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
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : "bg-gray-700/50 text-gray-300 border-gray-600"
                    }`}
                  >
                    {activation.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                {/* Server Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-13">
                  {/* IP Address */}
                  {activation.serverIp && (
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#333]">
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
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#333]">
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
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#333]">
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
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#333]">
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
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#333]">
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
                  <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#333]">
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

      {/* Instructions */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 mt-6 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Setup Instructions</h2>
        <ol className="list-decimal list-inside text-gray-300 space-y-2">
          <li>Download the TownyFaiths plugin from the Downloads page</li>
          <li>Place the .jar file in your server&apos;s plugins folder</li>
          <li>Start your server to generate the config files</li>
          <li>
            Open <code className="bg-gray-900 px-2 py-1 rounded">plugins/TownyFaiths/config.yml</code>
          </li>
          <li>
            Set <code className="bg-gray-900 px-2 py-1 rounded">license.key</code> to your license key above
          </li>
          <li>Restart your server or run <code className="bg-gray-900 px-2 py-1 rounded">/license revalidate</code></li>
        </ol>
      </div>
    </div>
  );
}
