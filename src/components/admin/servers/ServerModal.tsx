"use client";

import { ServerStatus, ServerFormData } from "./types";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";

interface ServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ServerFormData) => Promise<void>;
  editingServer?: ServerStatus | null;
  isSubmitting: boolean;
}

export default function ServerModal({
  isOpen,
  onClose,
  onSubmit,
  editingServer,
  isSubmitting,
}: ServerModalProps) {
  const [formData, setFormData] = useState<ServerFormData>({
    name: editingServer?.name || "",
    ip: editingServer?.ip || "",
    port: editingServer?.port.toString() || "25565",
    isPublic: editingServer?.isPublic ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    if (!editingServer) {
      setFormData({ name: "", ip: "", port: "25565", isPublic: true });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-[#111] rounded-xl border border-[#222] w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icon name="Server" className="w-5 h-5 text-blue-400" />
            {editingServer ? "Edit Server" : "Add New Server"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#222] text-gray-400 hover:text-white transition-colors"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Server Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              placeholder="Main Server"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                IP Address *
              </label>
              <input
                type="text"
                required
                value={formData.ip}
                onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                placeholder="play.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Port
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                placeholder="25565"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-blue-500 focus:ring-blue-500/50"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-300">
              Show on homepage (publicly visible)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#1a1a1a] hover:bg-[#222] text-white rounded-lg font-medium transition-colors border border-[#333]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : editingServer ? "Save Changes" : "Add Server"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
