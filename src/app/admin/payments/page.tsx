"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertBox } from "@/components/ui/AlertBox";
import { MinecraftIcon } from "@/components/ui/MinecraftIcon";

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
  const [activeTab, setActiveTab] = useState<"payku" | "paypal" | "tebex">("payku");
  
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
    if (value === initialValue) return undefined;
    if (value.trim().length === 0) return initialValue.trim().length > 0 ? null : undefined;
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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-400 animate-pulse">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#121212] via-[#0a0a0a] to-[#050505] p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full -ml-16 -mb-16"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <MinecraftIcon sprite="gold-ingot" scale={1} />
              </div>
              <span className="text-sm font-bold tracking-wider text-amber-500 uppercase">{t("admin.payments")}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              {t("admin.paymentSettings")}
            </h1>
            <p className="mt-4 text-gray-400 max-w-2xl text-lg leading-relaxed">
              {t("admin.paymentSettingsDesc")}
            </p>
          </div>
          
          <button
            onClick={saveSettings}
            disabled={saving}
            className="group relative flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-800 text-black font-bold rounded-2xl transition-all duration-300 shadow-[0_10px_30px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)] disabled:shadow-none hover:-translate-y-1 active:translate-y-0"
          >
            {saving ? <MinecraftIcon sprite="clock" scale={0.8} className="animate-spin" /> : <MinecraftIcon sprite="emerald" scale={0.8} className="group-hover:scale-110 transition-transform" />}
            {saving ? t("admin.saving") : t("admin.saveConfig")}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        {error && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <AlertBox type="error" onDismiss={() => setError(null)}>{error}</AlertBox>
          </div>
        )}
        {success && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <AlertBox type="success" onDismiss={() => setSuccess(null)}>{success}</AlertBox>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#0a0a0a] border border-white/5 rounded-2xl shadow-inner">
        {(["payku", "paypal", "tebex"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold transition-all duration-300 ${
              activeTab === tab
                ? "bg-[#1a1a1a] text-white shadow-lg border border-white/10"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            {tab === "payku" && <MinecraftIcon sprite="gold-ingot" scale={0.7} isSmall />}
            {tab === "paypal" && <MinecraftIcon sprite="filled-map" scale={0.7} isSmall />}
            {tab === "tebex" && <MinecraftIcon sprite="shield" scale={0.7} isSmall />}
            <span className="capitalize">{tab}</span>
          </button>
        ))}
      </div>

      {/* Control Panel Area */}
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Column: General Gateway Status */}
        <div className="md:col-span-1 space-y-6">
          <Card className="p-6 border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <MinecraftIcon sprite="redstone-dust" scale={0.7} isSmall />
              {t("admin.gatewayStatus")}
            </h3>
            
            <div className="space-y-4">
              <label className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                activeTab === 'payku' ? (paykuEnabled ? 'border-amber-500 bg-amber-500/5' : 'border-gray-800 bg-black') : 
                activeTab === 'paypal' ? (paypalEnabled ? 'border-blue-500 bg-blue-500/5' : 'border-gray-800 bg-black') :
                (tebexEnabled ? 'border-green-500 bg-green-500/5' : 'border-gray-800 bg-black')
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    activeTab === 'payku' ? (paykuEnabled ? 'bg-amber-500' : 'bg-gray-600') : 
                    activeTab === 'paypal' ? (paypalEnabled ? 'bg-blue-500' : 'bg-gray-600') :
                    (tebexEnabled ? 'bg-green-500' : 'bg-gray-600')
                  } shadow-[0_0_10px_currentColor]`}></div>
                  <span className="font-bold text-gray-200">{t("admin.paymentActive")}</span>
                </div>
                <input
                  type="checkbox"
                  checked={activeTab === 'payku' ? paykuEnabled : activeTab === 'paypal' ? paypalEnabled : tebexEnabled}
                  onChange={(e) => {
                    if (activeTab === 'payku') setPayKuEnabled(e.target.checked);
                    else if (activeTab === 'paypal') setPaypalEnabled(e.target.checked);
                    else setTebexEnabled(e.target.checked);
                  }}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                  (activeTab === 'payku' && paykuEnabled) || (activeTab === 'paypal' && paypalEnabled) || (activeTab === 'tebex' && tebexEnabled)
                    ? 'bg-amber-500' : 'bg-gray-800'
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 transform ${
                    (activeTab === 'payku' && paykuEnabled) || (activeTab === 'paypal' && paypalEnabled) || (activeTab === 'tebex' && tebexEnabled)
                      ? 'translate-x-6' : ''
                  }`}></div>
                </div>
              </label>

              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-200 leading-relaxed italic flex gap-3">
                <MinecraftIcon sprite="barrier" scale={0.6} isSmall />
                <p>{t("admin.paymentGlobalWarning")}</p>
              </div>
            </div>
          </Card>

          {/* Config Source Indicator */}
          {activeTab !== "tebex" && (
            <Card className="p-6 border-white/5 bg-[#0a0a0a]/50">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">{t("admin.configSource")}</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => activeTab === 'payku' ? setPayKuSource("ENV") : setPaypalSource("ENV")}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    (activeTab === 'payku' ? paykuSource : paypalSource) === "ENV"
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                      : "bg-[#050505] border-white/5 text-gray-500 hover:border-white/10"
                  }`}
                >
                  <MinecraftIcon sprite="redstone-dust" scale={0.7} isSmall />
                  <div className="text-left">
                    <div className="font-bold text-sm">{t("admin.envVariables")}</div>
                    <div className="text-[10px] opacity-70">{t("admin.envVariablesDesc")}</div>
                  </div>
                </button>
                <button
                  onClick={() => activeTab === 'payku' ? setPayKuSource("PANEL") : setPaypalSource("PANEL")}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    (activeTab === 'payku' ? paykuSource : paypalSource) === "PANEL"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                      : "bg-[#050505] border-white/5 text-gray-500 hover:border-white/10"
                  }`}
                >
                  <MinecraftIcon sprite="chest" scale={0.7} isSmall />
                  <div className="text-left">
                    <div className="font-bold text-sm">{t("admin.panelDashboard")}</div>
                    <div className="text-[10px] opacity-70">{t("admin.panelDashboardDesc")}</div>
                  </div>
                </button>
              </div>
            </Card>
          )}

          {/* Environment Mode */}
          <Card className="p-6 border-white/5 bg-[#0a0a0a]/50">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">{t("admin.gatewayEnvironment")}</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={(activeTab === 'payku' && paykuSource === 'ENV') || (activeTab === 'paypal' && paypalSource === 'ENV')}
                onClick={() => {
                  if (activeTab === 'payku') setPayKuEnvironment("SANDBOX");
                  else if (activeTab === 'paypal') setPaypalEnvironment("SANDBOX");
                  else setTebexEnvironment("SANDBOX");
                }}
                className={`p-3 rounded-xl border transition-all font-bold text-sm ${
                  (activeTab === 'payku' ? paykuEnvironment : activeTab === 'paypal' ? paypalEnvironment : tebexEnvironment) === "SANDBOX"
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                    : "bg-[#050505] border-white/5 text-gray-500 hover:border-white/10"
                } disabled:opacity-30`}
              >
                {t("admin.sandbox")}
              </button>
              <button
                disabled={(activeTab === 'payku' && paykuSource === 'ENV') || (activeTab === 'paypal' && paypalSource === 'ENV')}
                onClick={() => {
                  if (activeTab === 'payku') setPayKuEnvironment("PRODUCTION");
                  else if (activeTab === 'paypal') setPaypalEnvironment("PRODUCTION");
                  else setTebexEnvironment("PRODUCTION");
                }}
                className={`p-3 rounded-xl border transition-all font-bold text-sm ${
                  (activeTab === 'payku' ? paykuEnvironment : activeTab === 'paypal' ? paypalEnvironment : tebexEnvironment) === "PRODUCTION"
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-[#050505] border-white/5 text-gray-500 hover:border-white/10"
                } disabled:opacity-30`}
              >
                {t("admin.production")}
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Configuration Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-8 border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl relative overflow-hidden min-h-[500px]">
            {/* Background Decorative element */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-white capitalize">{activeTab} {t("admin.integration")}</h2>
                  <p className="text-gray-500 mt-1">{t("admin.integrationDesc")}</p>
                </div>
                {(activeTab === 'payku' ? paykuEnabled : activeTab === 'paypal' ? paypalEnabled : tebexEnabled) ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/20">
                    <MinecraftIcon sprite="emerald" scale={0.3} isSmall /> {t("admin.live")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 px-3 py-1 bg-gray-500/10 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-white/5">
                    <MinecraftIcon sprite="barrier" scale={0.3} isSmall /> {t("admin.off")}
                  </span>
                )}
              </div>

              {/* Payku Content */}
              {activeTab === "payku" && (
                <div className={`space-y-6 transition-all duration-500 ${paykuSource === 'ENV' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-300 px-1">{t("admin.apiToken")}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <MinecraftIcon sprite="writable-book" scale={0.6} isSmall className="opacity-50 group-focus-within:opacity-100 transition-opacity" />
                        </div>
                        <input
                          type="password"
                          value={paykuApiToken}
                          onChange={(e) => setPayKuApiToken(e.target.value)}
                          placeholder="pk_live_..."
                          className="w-full bg-black/50 border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-gray-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-300 px-1">{t("admin.secretKey")}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <MinecraftIcon sprite="shield" scale={0.6} isSmall className="opacity-50 group-focus-within:opacity-100 transition-opacity" />
                        </div>
                        <input
                          type="password"
                          value={paykuSecretKey}
                          onChange={(e) => setPayKuSecretKey(e.target.value)}
                          placeholder="••••••••••••••••"
                          className="w-full bg-black/50 border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-300 px-1">{t("admin.apiUrl")}</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MinecraftIcon sprite="filled-map" scale={0.6} isSmall className="opacity-50 group-focus-within:opacity-100 transition-opacity" />
                      </div>
                      <input
                        type="text"
                        value={paykuApiUrl}
                        onChange={(e) => setPayKuApiUrl(e.target.value)}
                        placeholder="https://api.payku.cl"
                        className="w-full bg-black/50 border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-4 text-gray-400">
                      <div className="flex-1">
                        <h4 className="font-bold text-white mb-1">{t("admin.devDocTitle")}</h4>
                        <p className="text-xs">{t("admin.devDocDesc")}</p>
                      </div>
                      <a href="https://payku.cl/dashboard" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                         <MinecraftIcon sprite="paper" scale={0.8} />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* PayPal Content */}
              {activeTab === "paypal" && (
                <div className={`space-y-6 transition-all duration-500 ${paypalSource === 'ENV' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                   <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-300 px-1">{t("admin.clientId")}</label>
                      <input
                        type="text"
                        value={paypalClientId}
                        onChange={(e) => setPaypalClientId(e.target.value)}
                        className="w-full bg-black/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-300 px-1">{t("admin.clientSecret")}</label>
                      <input
                        type="password"
                        value={paypalClientSecret}
                        onChange={(e) => setPaypalClientSecret(e.target.value)}
                        className="w-full bg-black/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-300 px-1">{t("admin.webhookId")}</label>
                      <input
                        type="text"
                        value={paypalWebhookId}
                        onChange={(e) => setPaypalWebhookId(e.target.value)}
                        className="w-full bg-black/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-300 px-1">{t("admin.apiUrl")}</label>
                      <input
                        type="text"
                        value={paypalApiUrl}
                        onChange={(e) => setPaypalApiUrl(e.target.value)}
                        placeholder="https://api-m.sandbox.paypal.com"
                        className="w-full bg-black/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tebex Content */}
              {activeTab === "tebex" && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-300 px-1">{t("admin.storeId")}</label>
                    <input
                      type="text"
                      value={tebexStoreId}
                      onChange={(e) => setTebexStoreId(e.target.value)}
                      className="w-full bg-black/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-300 px-1">{t("admin.secretKey")}</label>
                    <input
                      type="password"
                      value={tebexSecretKey}
                      onChange={(e) => setTebexSecretKey(e.target.value)}
                      placeholder={t("admin.secretKeyPlaceholder")}
                      className="w-full bg-black/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500/50 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Source Warning Badge */}
              {activeTab !== "tebex" && (activeTab === 'payku' ? paykuSource : paypalSource) === "ENV" && (
                <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
                  <MinecraftIcon sprite="redstone-dust" scale={0.8} />
                  <p className="text-xs font-semibold leading-relaxed">
                    {t("admin.editingDisabledEnv")}
                  </p>
                </div>
              )}
            </div>
            
            {/* Empty state hint */}
            <div className="mt-12 text-center">
               <p className="text-xs text-gray-600 flex items-center justify-center gap-2">
                 <MinecraftIcon sprite="clock" scale={0.4} isSmall />
                 {t("admin.emptyFieldsClears")}
               </p>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Visual background subtle text */}
      <div className="fixed bottom-0 right-0 p-10 opacity-5 pointer-events-none select-none">
        <h2 className="text-[12rem] font-black leading-none uppercase tracking-tighter">PAYMENTS</h2>
      </div>
    </div>
  );
}
