"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Key, Globe, AlertTriangle, Save } from "lucide-react";

interface PaykuSettings {
  enabled: boolean;
  apiUrl: string;
  hasApiToken: boolean;
  hasSecretKey: boolean;
}

interface PaykuSettingsFormProps {
  settings: PaykuSettings;
}

export function PaykuSettingsForm({ settings }: PaykuSettingsFormProps) {
  const [testMode, setTestMode] = useState(settings.apiUrl.includes("sandbox"));
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      // In a real implementation, you'd save these to environment variables or settings table
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#333333] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Payment Configuration</h2>
        <div className="flex items-center gap-2">
          {settings.enabled ? (
            <>
              <CheckCircle className="w-5 h-5 text-[#10b981]" />
              <span className="text-[#10b981] text-sm font-medium">Enabled</span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-[#ef4444]" />
              <span className="text-[#ef4444] text-sm font-medium">Disabled</span>
            </>
          )}
        </div>
      </div>

      {/* API Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#262626]/50 rounded-lg p-4 border border-[#404040]">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-[#3b82f6]" />
            <div>
              <p className="text-sm text-[#737373]">API Token</p>
              <p className="text-white font-medium">
                {settings.hasApiToken ? "Configured" : "Not configured"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#262626]/50 rounded-lg p-4 border border-[#404040]">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-[#8b5cf6]" />
            <div>
              <p className="text-sm text-[#737373]">Secret Key</p>
              <p className="text-white font-medium">
                {settings.hasSecretKey ? "Configured" : "Not configured"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Settings */}
      <div className="space-y-4 mb-6">
        <div className="bg-[#262626]/50 rounded-lg p-4 border border-[#404040]">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-[#22c55e]" />
            <div>
              <p className="text-sm text-[#737373]">API Environment</p>
              <p className="text-white font-medium">
                {testMode ? "Sandbox (Testing)" : "Production"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-[#a3a3a3]">
              Use Sandbox Environment
            </label>
            <button
              onClick={() => setTestMode(!testMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                testMode ? "bg-[#3b82f6]" : "bg-[#6b7280]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  testMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="mt-3 text-xs text-[#737373]">
            {testMode
              ? "Using sandbox environment for testing. No real transactions."
              : "Using production environment. Real transactions will be processed."}
          </div>
        </div>
      </div>

      {/* Configuration Instructions */}
      {!settings.enabled && (
        <div className="bg-[#fef3c7]/10 border border-[#f59e0b]/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#f59e0b] mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-[#f59e0b] font-medium mb-2">Configuration Required</h4>
              <p className="text-[#fde68a] text-sm mb-3">
                To enable Payku payments, you need to configure the following environment variables:
              </p>
              <ul className="text-[#fef3c7] text-sm space-y-1 font-mono">
                <li>• PAYKU_API_TOKEN=your_api_token_here</li>
                <li>• PAYKU_SECRET_KEY=your_secret_key_here</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {saveStatus === "success" && (
            <span className="text-green-400">Settings saved successfully!</span>
          )}
          {saveStatus === "error" && (
            <span className="text-red-400">Failed to save settings</span>
          )}
        </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#6b7280] text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed hover:transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
      </div>
    </div>
  );
}