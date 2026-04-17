"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useIcon } from "@/hooks/useIcon";
import { useTranslation } from "@/i18n/useTranslation";

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
    icon: string | null;
    apiToken: string | null;
  };
  user: {
    id: string;
    email: string;
    name: string | null;
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

export default function AdminLicenseDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const AlertTriangle = useIcon("AlertTriangle");
  const Loader2 = useIcon("Loader2");
  const ShieldX = useIcon("ShieldX");
  
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokeMessage, setRevokeMessage] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

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

  const maskApiKey = (key: string) => {
    if (key.length <= 12) return "•".repeat(key.length);
    return `${key.slice(0, 8)}${"•".repeat(8)}${key.slice(-4)}`;
  };

  const copyApiKey = async () => {
    if (!license?.product?.apiToken) return;
    await navigator.clipboard.writeText(license.product.apiToken);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const revokeLicense = async () => {
    if (!license || license.status === "REVOKED" || revoking) {
      return;
    }

    setRevoking(true);
    setRevokeError(null);
    setRevokeMessage(null);

    try {
      const res = await fetch(`/api/licenses/${license.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to revoke license");
      }

      setLicense((prev) => (prev ? { ...prev, status: "REVOKED" } : prev));
      setRevokeMessage(data.message || "License revoked successfully");
      setRevokeConfirm("");
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : "Failed to revoke license");
    } finally {
      setRevoking(false);
    }
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
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
        <div className="text-red-400 mb-4">{error || "License not found"}</div>
        <Link
          href="/admin/licenses"
          className="text-blue-400 hover:text-blue-300"
        >
          Back to Licenses
        </Link>
      </div>
    );
  }

  const isExpired = new Date() > new Date(license.expiresAt);
  const activeActivations = license.activations.filter((a) => a.isActive).length;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/admin/licenses"
          className="text-gray-400 hover:text-white transition-colors"
        >
          &larr; Back to Licenses
        </Link>
      </div>

      {/* License Header */}
      <div className="pixel-frame pixel-frame-neutral bg-[#111] rounded-xl border border-[#222] p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              {license.product.icon ? (
                <span className={`icon-minecraft ${license.product.icon}`} />
              ) : null}
              {license.product.name}
            </h1>
            <p className="text-gray-400 mt-1">License Details - Store Admin</p>
            <div className="text-gray-400 text-sm mt-1">
              Customer: {license.user.email}
            </div>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              license.status === "ACTIVE" && !isExpired
                ? "bg-green-500/15 text-green-400 border border-green-500/20"
                : license.status === "EXPIRED" || isExpired
                ? "bg-red-500/15 text-red-400 border border-red-500/20"
                : license.status === "SUSPENDED"
                ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                : license.status === "REVOKED"
                ? "bg-red-950/40 text-red-300 border border-red-900"
                : "bg-[#181818] text-gray-300 border border-[#333]"
            }`}
          >
            {isExpired ? "EXPIRED" : license.status}
          </span>
        </div>

        {/* License Key */}
        <div className="pixel-frame pixel-frame-neutral bg-[#0a0a0a] rounded-xl p-4 mb-6 border border-[#222]">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">License Key</div>
              <code className="text-green-400 font-mono text-lg break-all">
                {license.licenseKey}
              </code>
            </div>
            <button
              onClick={copyLicenseKey}
              className="bg-[#181818] hover:bg-[#222] text-white px-4 py-2 rounded-xl text-sm transition-colors border border-[#333]"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* API Key */}
        {license.product.apiToken && (
          <div className="bg-[#0a0a0a] rounded-xl p-4 mb-6 border border-yellow-500/30">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-yellow-400 text-sm mb-1">API Key (for plugin)</div>
                <code className="text-yellow-500 font-mono text-lg break-all">
                  {maskApiKey(license.product.apiToken)}
                </code>
              </div>
              <button
                onClick={copyApiKey}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-4 py-2 rounded-xl text-sm transition-colors border border-yellow-500/30"
              >
                {apiKeyCopied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

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
      <div className="bg-[#111] rounded-xl border border-[#222]">
        <div className="px-6 py-4 border-b border-[#222]">
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
          <div className="divide-y divide-[#222]">
            {license.activations.map((activation) => (
              <div key={activation.id} className="px-6 py-4 hover:bg-[#151515] transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          activation.isActive ? "bg-green-400" : "bg-gray-500"
                        }`}
                      />
                      <span className="text-white font-mono">
                        Server ID: {activation.serverId}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>{t("admin.pluginVersion")}: {activation.serverVersion || t("admin.unknown")}</div>
                      <div>
                        {t("dashboard.created")}:{" "}
                        {new Date(activation.firstSeenAt).toLocaleString()}
                      </div>
                      <div>
                        {t("dashboard.lastValidated")}:{" "}
                        {new Date(activation.lastSeenAt).toLocaleString()}
                      </div>
                      <div>{t("admin.validations")}: {activation.validationCount}</div>
                      {activation.hardwareHash && (
                        <div>{t("admin.hardwareHash")}: {activation.hardwareHash.substring(0, 16)}...</div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      activation.isActive
                        ? "bg-green-500/15 text-green-400 border border-green-500/20"
                        : "bg-[#181818] text-gray-300 border border-[#333]"
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

      {/* Revoke Danger Zone */}
      <div className="mt-6 bg-red-950/20 rounded-xl border border-red-900/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-900/60">
          <h2 className="text-lg font-semibold text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h2>
          <p className="text-red-200/70 text-sm mt-1">
            Revoking disables this license for all current and future activations.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="text-sm text-red-100/80">
            Type <code className="bg-black/30 px-1.5 py-0.5 rounded">REVOKE</code> to confirm.
          </div>

          <input
            value={revokeConfirm}
            onChange={(e) => setRevokeConfirm(e.target.value)}
            placeholder="REVOKE"
            disabled={license.status === "REVOKED" || revoking}
            className="w-full md:max-w-sm bg-[#0d0d0d] border border-red-900/70 rounded-xl px-3 py-2 text-white placeholder-red-300/40 focus:outline-none focus:border-red-500 disabled:opacity-60"
          />

          {revokeError && (
            <div className="text-sm text-red-300 bg-red-950/40 border border-red-900/70 rounded-xl px-3 py-2">
              {revokeError}
            </div>
          )}

          {revokeMessage && (
            <div className="text-sm text-green-300 bg-green-950/30 border border-green-900/70 rounded-xl px-3 py-2">
              {revokeMessage}
            </div>
          )}

          <button
            onClick={revokeLicense}
            disabled={license.status === "REVOKED" || revokeConfirm !== "REVOKE" || revoking}
            className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-600 disabled:bg-red-900/50 disabled:text-red-300/60 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            {revoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
            {license.status === "REVOKED" ? "License Already Revoked" : revoking ? "Revoking..." : "Revoke License"}
          </button>
        </div>
      </div>
    </div>
  );
}
