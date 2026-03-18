"use client";

import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const version = versions.find(v => v.id === e.target.value);
    if (version && version.downloadUrl) {
      window.open(version.downloadUrl, '_blank');
    }
  };

  if (versions.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-sm">No versions</span>
        <a
          href={`/admin/products/${productId}/versions/new`}
          className="text-[#f59e0b] hover:text-[#d97706] text-sm font-medium"
        >
          + Add
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select 
          className="bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]/50"
          onChange={handleVersionChange}
          defaultValue=""
        >
          <option value="" disabled>Select version</option>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.version} {v.isLatest ? '(Latest)' : ''} {v.isBeta ? '(Beta)' : ''}
            </option>
          ))}
        </select>
        <a
          href={`/admin/products/${productId}/versions`}
          className="text-[#f59e0b] hover:text-[#d97706] p-2 hover:bg-[#f59e0b]/10 rounded-lg transition-all border border-transparent hover:border-[#f59e0b]/20"
          title="Manage Versions"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </a>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {versions[0]?.isBeta && (
          <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs rounded">
            Beta
          </span>
        )}
        {versions[0]?.isMandatory && (
          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 text-xs rounded">
            Required
          </span>
        )}
        <span className="text-xs text-gray-500">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
