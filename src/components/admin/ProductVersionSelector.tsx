"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface Version {
  id: string;
  version: string;
  isLatest: boolean;
  isBeta: boolean;
  isMandatory: boolean;
  downloadUrl: string;
}

interface ProductVersionSelectorProps {
  versions: Version[];
  productId: string;
}

export default function ProductVersionSelector({ versions, productId }: ProductVersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const latestVersion = versions.find((v) => v.isLatest) || versions[0];

  const handleDownload = async (version: Version) => {
    if (!version.downloadUrl) return;
    
    setDownloading(version.id);
    try {
      window.open(version.downloadUrl, "_blank");
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  if (versions.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-sm">No versions</span>
        <a
          href={`/admin/products/${productId}/versions/new`}
          className="text-[#f59e0b] hover:text-[#d97706] text-sm font-medium hover:underline"
        >
          + Add
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {latestVersion && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload(latestVersion)}
            disabled={downloading === latestVersion.id || !latestVersion.downloadUrl}
            className="flex items-center gap-2 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 border border-[#22c55e]/30 text-[#22c55e] px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          >
            <Icon name="Download" className={`w-4 h-4 ${downloading === latestVersion.id ? "animate-bounce" : ""}`} />
            v{latestVersion.version}
            {latestVersion.isBeta && (
              <span className="px-1 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded">Beta</span>
            )}
            {latestVersion.isMandatory && (
              <span className="px-1 py-0.5 bg-red-500/20 text-red-300 text-xs rounded">Required</span>
            )}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-[#222] rounded-lg transition-all text-gray-400 hover:text-white"
            title="More versions"
          >
            <Icon name="ChevronDown" className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="bg-[#0a0a0a] border border-[#333] rounded-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {versions.map((version) => (
              <button
                key={version.id}
                onClick={() => handleDownload(version)}
                disabled={downloading === version.id || !version.downloadUrl}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#1a1a1a] transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Icon name="Package" className="w-4 h-4 text-gray-500" />
                  <span className="text-white text-sm font-mono">
                    v{version.version}
                  </span>
                  {version.isLatest && (
                    <span className="px-1.5 py-0.5 bg-[#22c55e]/20 text-[#22c55e] text-xs rounded">Latest</span>
                  )}
                  {version.isBeta && !version.isLatest && (
                    <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded">Beta</span>
                  )}
                  {version.isMandatory && (
                    <span className="px-1.5 py-0.5 bg-red-500/20 text-red-300 text-xs rounded">Required</span>
                  )}
                </div>
                {version.downloadUrl ? (
                  <Icon name="Download" className={`w-4 h-4 text-gray-400 ${downloading === version.id ? "animate-bounce" : ""}`} />
                ) : (
                  <span className="text-xs text-gray-500">No URL</span>
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-[#333] px-3 py-2">
            <a
              href={`/admin/products/${productId}/versions`}
              className="flex items-center gap-1 text-xs text-[#f59e0b] hover:text-[#d97706] hover:underline"
            >
              <Icon name="ExternalLink" className="w-3 h-3" />
              Manage Versions
            </a>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        {versions.length} version{versions.length !== 1 ? "s" : ""} total
      </div>
    </div>
  );
}
