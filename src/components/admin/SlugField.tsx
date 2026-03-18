"use client";

import { useState, useEffect } from "react";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

interface SlugFieldProps {
  name: string;
  productName: string;
  initialValue?: string;
}

export default function SlugField({ name, productName, initialValue = "" }: SlugFieldProps) {
  const [slug, setSlug] = useState(initialValue);
  const [autoGenerate, setAutoGenerate] = useState(true);

  useEffect(() => {
    if (autoGenerate && productName) {
      setSlug(generateSlug(productName));
    }
  }, [productName, autoGenerate]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={name} className="block text-sm font-medium text-gray-300">
          URL Slug *
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={autoGenerate}
            onChange={(e) => setAutoGenerate(e.target.checked)}
            className="rounded border-[#333] bg-[#0a0a0a] text-[#f59e0b] focus:ring-[#f59e0b]"
          />
          Auto-generate
        </label>
      </div>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          /
        </div>
        <input
          type="text"
          id={name}
          name={name}
          required
          pattern="[a-z0-9-]+"
          value={slug}
          onChange={(e) => {
            setSlug(generateSlug(e.target.value));
            setAutoGenerate(false);
          }}
          className="w-full px-3 py-2 pl-7 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent hover:border-[#f59e0b]/30 transition-all"
          placeholder="my-plugin"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Lowercase letters, numbers, and hyphens only • Preview: /store/{slug || "my-plugin"}
      </p>
    </div>
  );
}
