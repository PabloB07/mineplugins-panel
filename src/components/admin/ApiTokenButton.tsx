"use client";

import { useState } from "react";
import { Key, Copy, RefreshCw } from "lucide-react";

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

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action: "regenerateToken" }),
      });
      const data = await res.json();
      if (data.apiToken) {
        setToken(data.apiToken);
      }
    } catch (error) {
      console.error("Failed to regenerate token:", error);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowToken(!showToken)}
        className="text-yellow-500 hover:text-yellow-400 p-2 hover:bg-yellow-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-yellow-500/20"
        title="View API Key"
      >
        <Key className="w-4 h-4" />
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
            {copied ? <span className="text-xs text-green-400">✓</span> : <Copy className="w-3 h-3" />}
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="text-gray-400 hover:text-yellow-400"
            title="Regenerate"
          >
            <RefreshCw className={`w-3 h-3 ${regenerating ? "animate-spin" : ""}`} />
          </button>
        </div>
      )}
    </div>
  );
}