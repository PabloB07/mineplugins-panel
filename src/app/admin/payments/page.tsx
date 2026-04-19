"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertBox } from "@/components/ui/AlertBox";

type EnvMode = "SANDBOX" | "PRODUCTION";
type ConfigSource = "ENV" | "PANEL";

interface PaymentSettingsResponse {
  payku: {
    enabled: boolean;
    source: ConfigSource;
    apiToken: string;
    secretKey: string;
    environment: EnvMode;
    apiUrl: string;
    hasApiToken: boolean;
    hasSecretKey: boolean;
  };
  tebex: {
    enabled: boolean;
    storeId: string;
    secretKey: string;
    environment: EnvMode;
    hasSecretKey: boolean;
  };
  paypal: {
    enabled: boolean;
    source: ConfigSource;
    clientId: string;
    clientSecret: string;
    webhookId: string;
    environment: EnvMode;
    apiUrl: string;
    hasClientSecret: boolean;
  };
}

interface PaymentSettingsSnapshot {
  paykuApiToken: string;
  paykuSecretKey: string;
  paykuApiUrl: string;
  tebexStoreId: string;
  tebexSecretKey: string;
  paypalClientId: string;
  paypalClientSecret: string;
  paypalWebhookId: string;
  paypalApiUrl: string;
}

const EMPTY_SNAPSHOT: PaymentSettingsSnapshot = {
  paykuApiToken: "",
  paykuSecretKey: "",
  paykuApiUrl: "",
  tebexStoreId: "",
  tebexSecretKey: "",
  paypalClientId: "",
  paypalClientSecret: "",
  paypalWebhookId: "",
  paypalApiUrl: "",
};

export default function AdminPaymentsSettingsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<PaymentSettingsSnapshot>(EMPTY_SNAPSHOT);

  const [paykuEnabled, setPayKuEnabled] = useState(true);
  const [paykuSource, setPayKuSource] = useState<ConfigSource>("ENV");
  const [paykuEnvironment, setPayKuEnvironment] = useState<EnvMode>("SANDBOX");
  const [paykuApiToken, setPayKuApiToken] = useState("");
  const [paykuSecretKey, setPayKuSecretKey] = useState("");
  const [paykuApiUrl, setPayKuApiUrl] = useState("");

  const [tebexEnabled, setTebexEnabled] = useState(true);
  const [tebexEnvironment, setTebexEnvironment] = useState<EnvMode>("PRODUCTION");
  const [tebexStoreId, setTebexStoreId] = useState("");
  const [tebexSecretKey, setTebexSecretKey] = useState("");

  const [paypalEnabled, setPaypalEnabled] = useState(true);
  const [paypalSource, setPaypalSource] = useState<ConfigSource>("ENV");
  const [paypalEnvironment, setPaypalEnvironment] = useState<EnvMode>("SANDBOX");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalClientSecret, setPaypalClientSecret] = useState("");
  const [paypalWebhookId, setPaypalWebhookId] = useState("");
  const [paypalApiUrl, setPaypalApiUrl] = useState("");

  const applySettings = useCallback((data: PaymentSettingsResponse) => {
    setPayKuEnabled(data.payku.enabled);
    setPayKuSource(data.payku.source);
    setPayKuEnvironment(data.payku.environment);
    setPayKuApiToken(data.payku.apiToken || "");
    setPayKuSecretKey(data.payku.secretKey || "");
    setPayKuApiUrl(data.payku.apiUrl || "");
    setTebexEnabled(data.tebex.enabled);
    setTebexEnvironment(data.tebex.environment);
    setTebexStoreId(data.tebex.storeId || "");
    setTebexSecretKey(data.tebex.secretKey || "");
    setPaypalEnabled(data.paypal.enabled);
    setPaypalSource(data.paypal.source);
    setPaypalEnvironment(data.paypal.environment);
    setPaypalClientId(data.paypal.clientId || "");
    setPaypalClientSecret(data.paypal.clientSecret || "");
    setPaypalWebhookId(data.paypal.webhookId || "");
    setPaypalApiUrl(data.paypal.apiUrl || "");
    setInitialValues({
      paykuApiToken: data.payku.apiToken || "",
      paykuSecretKey: data.payku.secretKey || "",
      paykuApiUrl: data.payku.apiUrl || "",
      tebexStoreId: data.tebex.storeId || "",
      tebexSecretKey: data.tebex.secretKey || "",
      paypalClientId: data.paypal.clientId || "",
      paypalClientSecret: data.paypal.clientSecret || "",
      paypalWebhookId: data.paypal.webhookId || "",
      paypalApiUrl: data.paypal.apiUrl || "",
    });
  }, []);

  const loadSettings = useCallback(async () => {
    const response = await fetch("/api/admin/payment-settings");
    if (!response.ok) {
      throw new Error(t("admin.loadConfigError"));
    }

    const data = (await response.json()) as PaymentSettingsResponse;
    applySettings(data);
  }, [applySettings, t]);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadSettings();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("admin.loadConfigError"));
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [loadSettings, t]);

  const prepareValueForSave = (value: string, initialValue: string): string | null | undefined => {
    if (value === initialValue) {
      return undefined;
    }

    if (value.trim().length === 0) {
      return initialValue.trim().length > 0 ? null : undefined;
    }

    return value;
  };

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
            enabled: paykuEnabled,
            source: paykuSource,
            apiToken: prepareValueForSave(paykuApiToken, initialValues.paykuApiToken),
            secretKey: prepareValueForSave(paykuSecretKey, initialValues.paykuSecretKey),
            environment: paykuEnvironment,
            apiUrl: prepareValueForSave(paykuApiUrl, initialValues.paykuApiUrl),
          },
          tebex: {
            enabled: tebexEnabled,
            storeId: prepareValueForSave(tebexStoreId, initialValues.tebexStoreId),
            secretKey: prepareValueForSave(tebexSecretKey, initialValues.tebexSecretKey),
            environment: tebexEnvironment,
          },
          paypal: {
            enabled: paypalEnabled,
            source: paypalSource,
            clientId: paypalSource === "ENV" ? undefined : (paypalClientId || undefined),
            clientSecret: paypalSource === "ENV" ? undefined : (paypalClientSecret || undefined),
            webhookId: paypalSource === "ENV" ? undefined : (paypalWebhookId || undefined),
            environment: paypalEnvironment,
            apiUrl: paypalSource === "ENV" ? undefined : (paypalApiUrl || undefined),
          },
        }),
      });
      if (!response.ok) {
        throw new Error(t("admin.saveConfigError"));
      }
      await loadSettings();
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">{t("admin.payku")}</h2>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={paykuEnabled}
              onChange={(e) => setPayKuEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#f59e0b]"
            />
            {t("admin.enabled")}
          </label>
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-gray-300">
              {t("admin.configSource")}
              <select
                value={paykuSource}
                onChange={(e) => setPayKuSource(e.target.value as ConfigSource)}
                className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]/60"
              >
                <option value="ENV">{t("admin.useEnvConfig")}</option>
                <option value="PANEL">{t("admin.usePanelConfig")}</option>
              </select>
            </label>
            <label className="text-sm text-gray-300">
              {t("admin.mode")}
              <select
                value={paykuEnvironment}
                onChange={(e) => setPayKuEnvironment(e.target.value as EnvMode)}
                disabled={paykuSource === "ENV"}
                className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]/60"
              >
                <option value="SANDBOX">{t("admin.sandbox")}</option>
                <option value="PRODUCTION">{t("admin.production")}</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-gray-500">
            {paykuSource === "ENV" ? t("admin.paykuEnvModeHelp") : t("admin.paykuPanelModeHelp")}
          </p>
          <label className="block text-sm text-gray-300">
            {t("admin.apiToken")}
            <input
              type="password"
              value={paykuApiToken}
              onChange={(e) => setPayKuApiToken(e.target.value)}
              disabled={paykuSource === "ENV"}
              placeholder="pk_live_xxx / pk_test_xxx"
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f59e0b]/60"
            />
          </label>
          <label className="block text-sm text-gray-300">
            {t("admin.secretKey")}
            <input
              type="password"
              value={paykuSecretKey}
              onChange={(e) => setPayKuSecretKey(e.target.value)}
              disabled={paykuSource === "ENV"}
              placeholder={t("admin.secretKeyPlaceholder")}
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f59e0b]/60"
            />
          </label>
          <label className="block text-sm text-gray-300">
            {t("admin.apiUrl")}
            <input
              type="text"
              value={paykuApiUrl}
              onChange={(e) => setPayKuApiUrl(e.target.value)}
              disabled={paykuSource === "ENV"}
              placeholder="https://api.payku.cl"
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f59e0b]/60"
            />
          </label>
          <p className="text-xs text-gray-500">{t("admin.emptyFieldsClears")}</p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">{t("admin.paypal")}</h2>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={paypalEnabled}
              onChange={(e) => setPaypalEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#f59e0b]"
            />
            {t("admin.enabled")}
          </label>
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-gray-300">
              {t("admin.configSource")}
              <select
                value={paypalSource}
                onChange={(e) => setPaypalSource(e.target.value as ConfigSource)}
                className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]/60"
              >
                <option value="ENV">{t("admin.useEnvConfig")}</option>
                <option value="PANEL">{t("admin.usePanelConfig")}</option>
              </select>
            </label>
            <label className="text-sm text-gray-300">
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
          </div>
          <label className="block text-sm text-gray-300">
            {t("admin.clientId")}
            <input
              type="text"
              value={paypalClientId}
              onChange={(e) => setPaypalClientId(e.target.value)}
              disabled={paypalSource === "ENV"}
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]/60"
            />
          </label>
          <label className="block text-sm text-gray-300">
            {t("admin.clientSecret")}
            <input
              type="password"
              value={paypalClientSecret}
              onChange={(e) => setPaypalClientSecret(e.target.value)}
              disabled={paypalSource === "ENV"}
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]/60"
            />
          </label>
          <label className="block text-sm text-gray-300">
            {t("admin.webhookId")}
            <input
              type="text"
              value={paypalWebhookId}
              onChange={(e) => setPaypalWebhookId(e.target.value)}
              disabled={paypalSource === "ENV"}
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]/60"
            />
          </label>
          <label className="block text-sm text-gray-300">
            {t("admin.apiUrl")}
            <input
              type="text"
              value={paypalApiUrl}
              onChange={(e) => setPaypalApiUrl(e.target.value)}
              disabled={paypalSource === "ENV"}
              placeholder="https://api-m.sandbox.paypal.com"
              className="w-full mt-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f59e0b]/60"
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
