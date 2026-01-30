"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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
    serverVersion: string | null;
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
            className={`px-4 py-2 rounded-full text-sm font-medium ${license.status === "ACTIVE" && !isExpired
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
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Server Activations</h2>
          <p className="text-gray-400 text-sm">
            Servers that have activated this license
          </p>
        </div>

        {license.activations.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            No server activations yet. Use the license key above in your Minecraft
            server to activate.
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {license.activations.map((activation) => (
              <div key={activation.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${activation.isActive ? "bg-green-400" : "bg-gray-500"
                          }`}
                      />
                      <span className="text-white font-mono">
                        Server ID: {(!activation.serverId || activation.serverId.toLowerCase().trim() === "unknown") ? "ID Not Set" : activation.serverId}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>Plugin Version: {activation.serverVersion || "Unknown"}</div>
                      <div>
                        First Seen:{" "}
                        {new Date(activation.firstSeenAt).toLocaleString()}
                      </div>
                      <div>
                        Last Seen:{" "}
                        {new Date(activation.lastSeenAt).toLocaleString()}
                      </div>
                      <div>Validations: {activation.validationCount}</div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${activation.isActive
                      ? "bg-green-900 text-green-300"
                      : "bg-gray-700 text-gray-300"
                      }`}
                  >
                    {activation.isActive ? "Active" : "Inactive"}
                  </span>
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
