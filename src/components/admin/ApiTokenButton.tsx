"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface ApiTokenButtonProps {
  productId: string;
  apiToken: string | null;
}

export default function ApiTokenButton({ productId, apiToken }: ApiTokenButtonProps) {
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [token, setToken] = useState(apiToken);

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateOrRegenerate = async () => {
    setRegenerating(true);
    try {
      const action = token ? "regenerateToken" : "generateToken";
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action }),
      });
      const data = await res.json();
      if (data.apiToken) {
        setToken(data.apiToken);
        setShowToken(true);
      }
    } catch (error) {
      console.error("Failed to generate token:", error);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          if (!token) {
            handleGenerateOrRegenerate();
          } else {
            setShowToken(!showToken);
          }
        }}
        className={`p-2 rounded-lg transition-all duration-200 border border-transparent hover:border-yellow-500/20 ${
          token
            ? "text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
            : "text-gray-500 hover:text-gray-400 hover:bg-gray-500/10 border-gray-500/20"
        }`}
        title={token ? "View API Key" : "Generate API Key"}
      >
        {token ? <Icon name="Key" className="w-4 h-4" /> : <Icon name="Plus" className="w-4 h-4" />}
      </button>
      
      {showToken && token && (
        <div className="flex items-center gap-2 bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-yellow-500/30">
          <code className="text-yellow-500 font-mono text-xs max-w-[120px] truncate">
            {token.substring(0, 12)}...
          </code>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white"
            title="Copy"
          >
            {copied ? <span className="text-xs text-green-400">✓</span> : <Icon name="Copy" className="w-3 h-3" />}
          </button>
          <button
            onClick={handleGenerateOrRegenerate}
            disabled={regenerating}
            className="text-gray-400 hover:text-yellow-400"
            title="Regenerate"
          >
            <Icon name="RefreshCw" className={`w-3 h-3 ${regenerating ? "animate-spin" : ""}`} />
          </button>
        </div>
      )}
    </div>
  );
}