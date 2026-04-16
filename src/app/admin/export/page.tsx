"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { Icon } from "@/components/ui/Icon";

export default function AdminExportPage() {
  const { t } = useTranslation();
  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const exportOptions = [
    {
      title: tr("adminExport.licensesTitle", "Licenses"),
      description: tr("adminExport.licensesDesc", "Export all licenses with user, product, and status information"),
      endpoint: "/api/export/licenses",
      iconName: "KeyRound",
      accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
    },
    {
      title: tr("adminExport.ordersTitle", "Orders"),
      description: tr("adminExport.ordersDesc", "Export all orders with payment details and products"),
      endpoint: "/api/export/orders",
      iconName: "ShoppingCart",
      accent: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
    },
    {
      title: tr("adminExport.activationsTitle", "Activations"),
      description: tr("adminExport.activationsDesc", "Export server activation history"),
      endpoint: "/api/export/activations",
      iconName: "Activity",
      accent: "from-orange-500/20 to-orange-500/5 border-orange-500/30",
    },
    {
      title: tr("adminExport.downloadsTitle", "Download history"),
      description: tr("adminExport.downloadsDesc", "Export download history by user, product, and version"),
      endpoint: "/api/export/downloads",
      iconName: "Download",
      accent: "from-violet-500/20 to-violet-500/5 border-violet-500/30",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-[#2f2f2f] bg-gradient-to-br from-[#141414] to-[#0d0d0d] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{tr("adminExport.title", "Export Data")}</h1>
            <p className="mt-1 text-sm text-gray-400">{tr("adminExport.subtitle", "Download key business datasets in one click.")}</p>
          </div>
          <div className="pixel-frame pixel-frame-neutral rounded-xl border border-[#3a3a3a] bg-[#121212] p-2.5">
            <Icon name="FileText" className="h-5 w-5 text-[#f59e0b]" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {exportOptions.map((option) => (
          <a
            key={option.endpoint}
            href={`${option.endpoint}?format=csv`}
            className={`group relative overflow-hidden rounded-2xl border bg-[#111] p-5 transition-all hover:-translate-y-0.5 hover:border-[#f59e0b]/50 ${option.accent}`}
          >
            <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-lg border border-white/10 bg-[#0d0d0d] p-2">
                  <Icon name={option.iconName as any} className="h-4 w-4 text-gray-200" />
                </div>
                <span className="rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-semibold text-[#f59e0b]">
                  CSV
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-[#f59e0b]">
                {option.title}
              </h3>
              <p className="mt-1 text-sm text-gray-400">{option.description}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#f59e0b]">
                {tr("adminExport.downloadCsv", "Download CSV")}
                <Icon name="Download" className="h-3.5 w-3.5" />
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="pixel-frame pixel-frame-neutral rounded-xl border border-[#333] bg-[#111] p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">{tr("adminExport.tipTitle", "Quick tip")}</p>
          <p className="mt-1 text-sm text-gray-300">{tr("adminExport.tipBody", "Run exports in off-peak hours for very large datasets.")}</p>
        </div>
        <div className="pixel-frame pixel-frame-neutral rounded-xl border border-[#333] bg-[#111] p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">{tr("adminExport.formatTitle", "Format")}</p>
          <p className="mt-1 text-sm text-gray-300">{tr("adminExport.formatBody", "Use CSV for spreadsheets and JSON for integrations.")}</p>
        </div>
        <div className="pixel-frame pixel-frame-neutral rounded-xl border border-[#333] bg-[#111] p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">{tr("adminExport.limitTitle", "Limit")}</p>
          <p className="mt-1 text-sm text-gray-300">{tr("adminExport.limitBody", "Each export returns up to 10,000 records.")}</p>
        </div>
      </div>

      <div className="pixel-frame pixel-frame-neutral rounded-xl border border-[#333] bg-[#111] p-6">
        <h2 className="mb-4 text-white font-medium">{tr("adminExport.aboutTitle", "About export")}</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• {tr("adminExport.aboutItem1", "Files are exported in CSV format")}</li>
          <li>• {tr("adminExport.aboutItem2", "The maximum limit is 10,000 records per export")}</li>
          <li>• {tr("adminExport.aboutItem3", "Data includes all relevant system fields")}</li>
          <li>• {tr("adminExport.aboutItem4", "You can add filters using URL query parameters")}</li>
        </ul>
      </div>
    </div>
  );
}
