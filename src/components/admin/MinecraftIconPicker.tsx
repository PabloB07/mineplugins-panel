"use client";

import { useState, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import minecraftIcons from "@/messages/minecraft-block-and-entity.json";

interface MinecraftIconPickerProps {
  name: string;
  defaultValue: string;
}

export default function MinecraftIconPicker({
  name,
  defaultValue,
}: MinecraftIconPickerProps) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const icons = useMemo(() => {
    const data = minecraftIcons as Array<{
      label: string;
      name: string;
      css: string;
    }>;
    if (!search) return data.slice(0, 100);
    const searchLower = search.toLowerCase();
    return data.filter(
      (icon) =>
        icon.label.toLowerCase().includes(searchLower) ||
        icon.name.toLowerCase().includes(searchLower)
    );
  }, [search]);

  const selectedIcon = useMemo(() => {
    const data = minecraftIcons as Array<{
      label: string;
      name: string;
      css: string;
    }>;
    return data.find((icon) => icon.css === value);
  }, [value]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Product Icon (Minecraft)
      </label>

      <input type="hidden" name={name} value={value} />

      {value ? (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#111] border border-[#333] flex items-center justify-center overflow-hidden">
            <span className={`icon-minecraft-sm ${value}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-white font-medium">
              {selectedIcon?.label || "Unknown"}
            </p>
            <p className="text-xs text-gray-500">{selectedIcon?.name}</p>
          </div>
          <button
            type="button"
            onClick={() => setValue("")}
            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <Icon name="X" className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full h-16 border-2 border-dashed border-[#333] hover:border-[#f59e0b]/50 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[#f59e0b] transition-colors"
        >
          <span className="text-sm">Click to select Minecraft icon</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] rounded-xl border border-[#333] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#222] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Select Minecraft Icon</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-[#222] rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <Icon name="X" className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-[#222]">
              <div className="relative">
                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search icons..."
                  className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <div className="grid grid-cols-6 gap-2">
                {icons.map((icon) => (
                  <button
                    key={icon.css}
                    type="button"
                    onClick={() => {
                      setValue(icon.css);
                      setIsOpen(false);
                    }}
                    className="aspect-square rounded-lg bg-[#0a0a0a] border border-[#222] hover:border-[#f59e0b]/50 flex items-center justify-center transition-all hover:scale-105"
                    title={icon.label}
                  >
                    <span className={`icon-minecraft ${icon.css}`} />
                  </button>
                ))}
              </div>
              {icons.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No icons found matching "{search}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}