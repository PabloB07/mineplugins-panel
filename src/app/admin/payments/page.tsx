"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";

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
  const [status, setStatus] = useState<string>("");

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
      setStatus("");
      try {
        const response = await fetch("/api/admin/payment-settings");
        const data = (await response.json()) as PaymentSettingsResponse;

        if (!response.ok) {
          throw new Error("No se pudo cargar la configuración.");
        }

        setPaykuEnvironment(data.payku.environment);
        setTebexEnvironment(data.tebex.environment);
        setPaypalEnvironment(data.paypal.environment);

        setTebexStoreId(data.tebex.storeId || "");
        setPaypalClientId(data.paypal.clientId || "");
        setPaypalWebhookId(data.paypal.webhookId || "");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Error al cargar.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setStatus("");
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
        throw new Error("No se pudo guardar la configuración.");
      }

      setPaykuApiToken("");
      setPaykuSecretKey("");
      setTebexSecretKey("");
      setPaypalClientSecret("");
      setStatus("Configuración guardada correctamente.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const sectionClass = "bg-[#111] border border-[#222] rounded-xl p-6 space-y-4";
  const inputClass =
    "w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f59e0b]/60";

  if (loading) {
    return <div className="text-gray-300">Cargando configuración de pasarelas...</div>;
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="rounded-2xl border border-[#222] bg-gradient-to-r from-[#111] to-[#0a0a0a] p-8">
        <h1 className="text-3xl font-bold text-white">Configuración de Pagos</h1>
        <p className="mt-2 text-gray-400">
          Configura API keys y modo sandbox/producción para Payku, PayPal y Tebex.
        </p>
      </div>

      <div className={sectionClass}>
        <h2 className="text-xl font-semibold text-white">Payku</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-gray-300">
            Modo
            <select
              value={paykuEnvironment}
              onChange={(e) => setPaykuEnvironment(e.target.value as EnvMode)}
              className={`${inputClass} mt-1`}
            >
              <option value="SANDBOX">{t("admin.sandbox")}</option>
              <option value="PRODUCTION">{t("admin.production")}</option>
            </select>
          </label>
          <div className="text-xs text-gray-500 self-end pb-2">
            Si dejas campos vacíos se desactiva esa credencial guardada.
          </div>
        </div>
        <label className="block text-sm text-gray-300">
          API Token
          <input
            type="password"
            value={paykuApiToken}
            onChange={(e) => setPaykuApiToken(e.target.value)}
            placeholder="pk_live_xxx / pk_test_xxx"
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block text-sm text-gray-300">
          Secret Key (webhook)
          <input
            type="password"
            value={paykuSecretKey}
            onChange={(e) => setPaykuSecretKey(e.target.value)}
            placeholder="Secret para validar firma"
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>

      <div className={sectionClass}>
        <h2 className="text-xl font-semibold text-white">PayPal</h2>
        <label className="block text-sm text-gray-300">
          Modo
          <select
            value={paypalEnvironment}
            onChange={(e) => setPaypalEnvironment(e.target.value as EnvMode)}
            className={`${inputClass} mt-1`}
          >
            <option value="SANDBOX">{t("admin.sandbox")}</option>
            <option value="PRODUCTION">{t("admin.production")}</option>
          </select>
        </label>
        <label className="block text-sm text-gray-300">
          Client ID
          <input
            type="text"
            value={paypalClientId}
            onChange={(e) => setPaypalClientId(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block text-sm text-gray-300">
          Client Secret
          <input
            type="password"
            value={paypalClientSecret}
            onChange={(e) => setPaypalClientSecret(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block text-sm text-gray-300">
          Webhook ID
          <input
            type="text"
            value={paypalWebhookId}
            onChange={(e) => setPaypalWebhookId(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>

      <div className={sectionClass}>
        <h2 className="text-xl font-semibold text-white">Tebex</h2>
        <label className="block text-sm text-gray-300">
          Modo
          <select
            value={tebexEnvironment}
            onChange={(e) => setTebexEnvironment(e.target.value as EnvMode)}
            className={`${inputClass} mt-1`}
          >
            <option value="SANDBOX">{t("admin.sandbox")}</option>
            <option value="PRODUCTION">{t("admin.production")}</option>
          </select>
        </label>
        <label className="block text-sm text-gray-300">
          Store ID
          <input
            type="text"
            value={tebexStoreId}
            onChange={(e) => setTebexStoreId(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block text-sm text-gray-300">
          Secret Key
          <input
            type="password"
            value={tebexSecretKey}
            onChange={(e) => setTebexSecretKey(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="rounded-xl bg-[#f59e0b] px-6 py-2.5 font-semibold text-black hover:bg-[#d97706] disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
        {status && <p className="text-sm text-gray-300">{status}</p>}
      </div>
    </div>
  );
}

