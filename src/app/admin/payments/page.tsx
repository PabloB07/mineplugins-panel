"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertBox } from "@/components/ui/AlertBox";

type EnvMode = "SANDBOX" | "PRODUCTION";

interface PaymentSettingsResponse {
  payku: {
    environment: EnvMode;
    hasApiToken: boolean;
    hasSecretKey: boolean;
  };
  tebex: {
    storeId: string;
    environment: EnvMode;
    hasSecretKey: boolean;
  };
  paypal: {
    clientId: string;
    webhookId: string;
    environment: EnvMode;
    hasClientSecret: boolean;
  };
}

export default function AdminPaymentsSettingsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [paykuEnvironment, setPaykuEnvironment] = useState<EnvMode>("SANDBOX");
  const [paykuApiToken, setPaykuApiToken] = useState("");
  const [paykuSecretKey, setPaykuSecretKey] = useState("");

  const [tebexEnvironment, setTebexEnvironment] = useState<EnvMode>("PRODUCTION");
  const [tebexStoreId, setTebexStoreId] = useState("");
  const [tebexSecretKey, setTebexSecretKey] = useState("");

  const [paypalEnvironment, setPaypalEnvironment] = useState<EnvMode>("SANDBOX");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalClientSecret, setPaypalClientSecret] = useState("");
  const [paypalWebhookId, setPaypalWebhookId] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/payment-settings");
        if (!response.ok) {
          throw new Error(t("admin.loadConfigError"));
        }
        const data = (await response.json()) as PaymentSettingsResponse;
        setPaykuEnvironment(data.payku.environment);
        setTebexEnvironment(data.tebex.environment);
        setPaypalEnvironment(data.paypal.environment);
        setTebexStoreId(data.tebex.storeId || "");
        setPaypalClientId(data.paypal.clientId || "");
        setPaypalWebhookId(data.paypal.webhookId || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("admin.loadConfigError"));
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [t]);

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payku: {
            apiToken: paykuApiToken,
            secretKey: paykuSecretKey,
            environment: paykuEnvironment,
          },
          tebex: {
            storeId: tebexStoreId,
            secretKey: tebexSecretKey,
            environment: tebexEnvironment,
          },
          paypal: {
            clientId: paypalClientId,
            clientSecret: paypalClientSecret,
            webhookId: paypalWebhookId,
            environment: paypalEnvironment,
          },
        }),
      });
      if (!response.ok) {
        throw new Error(t("admin.saveConfigError"));
      }
      setPaykuApiToken("");
      setPaykuSecretKey("");
      setTebexSecretKey("");
      setPaypalClientSecret("");
      setSuccess(t("admin.configSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.saveConfigError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="relative rounded-2xl border border-[#222] bg-gradient-to-r from-[#111] to-[#0a0a0a] p-8">
        <h1 className="text-3xl font-bold text-white">{t("admin.paymentSettings")}</h1>
        <p className="mt-2 text-gray-400">{t("admin.paymentSettingsDesc")}</p>
      </div>

      {error && <AlertBox type="error" onDismiss={() => setError(null)}>{error}</AlertBox>}
      {success && <AlertBox type="success" onDismiss={() => setSuccess(null)}>{success}</AlertBox>}

      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">{t("admin.payku")}</h2>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-gray-300">
              {t("admin.mode")}
              <select
                value={paykuEnvironment}
                onChange={(e) => setPaykuEnvironment(e.target.value as EnvMode)}
                className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]/60"
              >
                <option value="SANDBOX">{t("admin.sandbox")}</option>
                <option value="PRODUCTION">{t("admin.production")}</option>
              </select>
            </label>
            <p className="text-xs text-gray-500 self-end pb-2">{t("admin.emptyFieldsClears")}</p>
          </div>
          <label className="block text-sm text-gray-300">
            {t("admin.apiToken")}
            <input
              type="password"
              value={paykuApiToken}
              onChange={(e) => setPaykuApiToken(e.target.value)}
              placeholder="pk_live_xxx / pk_test_xxx"
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f59e0b]/60"
            />
          </label>
          <label className="block text-sm text-gray-300">
            {t("admin.secretKey")}
            <input
              type="password"
              value={paykuSecretKey}
              onChange={(e) => setPaykuSecretKey(e.target.value)}
              placeholder={t("admin.secretKeyPlaceholder")}
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f59e0b]/60"
            />
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">{t("admin.paypal")}</h2>
        <div className="space-y-4">
          <label className="block text-sm text-gray-300">
            {t("admin.mode")}
            <select
              value={paypalEnvironment}
              onChange={(e) => setPaypalEnvironment(e.target.value as EnvMode)}
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]/60"
            >
              <option value="SANDBOX">{t("admin.sandbox")}</option>
              <option value="PRODUCTION">{t("admin.production")}</option>
            </select>
          </label>
          <label className="block text-sm text-gray-300">
            {t("admin.clientId")}
            <input
              type="text"
              value={paypalClientId}
              onChange={(e) => setPaypalClientId(e.target.value)}
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]/60"
            />
          </label>
          <label className="block text-sm text-gray-300">
            {t("admin.clientSecret")}
            <input
              type="password"
              value={paypalClientSecret}
              onChange={(e) => setPaypalClientSecret(e.target.value)}
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]/60"
            />
          </label>
          <label className="block text-sm text-gray-300">
            {t("admin.webhookId")}
            <input
              type="text"
              value={paypalWebhookId}
              onChange={(e) => setPaypalWebhookId(e.target.value)}
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]/60"
            />
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">{t("admin.tebex")}</h2>
        <div className="space-y-4">
          <label className="block text-sm text-gray-300">
            {t("admin.mode")}
            <select
              value={tebexEnvironment}
              onChange={(e) => setTebexEnvironment(e.target.value as EnvMode)}
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]/60"
            >
              <option value="SANDBOX">{t("admin.sandbox")}</option>
              <option value="PRODUCTION">{t("admin.production")}</option>
            </select>
          </label>
          <label className="block text-sm text-gray-300">
            {t("admin.storeId")}
            <input
              type="text"
              value={tebexStoreId}
              onChange={(e) => setTebexStoreId(e.target.value)}
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]/60"
            />
          </label>
          <label className="block text-sm text-gray-300">
            {t("admin.secretKey")}
            <input
              type="password"
              value={tebexSecretKey}
              onChange={(e) => setTebexSecretKey(e.target.value)}
              placeholder={t("admin.secretKeyPlaceholder")}
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f59e0b]/60"
            />
          </label>
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="rounded-xl bg-[#f59e0b] px-6 py-2.5 font-semibold text-black hover:bg-[#d97706] disabled:opacity-60"
        >
          {saving ? t("admin.saving") : t("admin.saveConfig")}
        </button>
      </div>
    </div>
  );
}
