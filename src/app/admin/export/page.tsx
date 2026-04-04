"use client";

export default function AdminExportPage() {
  const exportOptions = [
    {
      title: "Licencias",
      description: "Exportar todas las licencias con información de usuario, producto y estado",
      endpoint: "/api/export/licenses",
      icon: "Key",
    },
    {
      title: "Órdenes",
      description: "Exportar todas las órdenes con detalles de pago y productos",
      endpoint: "/api/export/orders",
      icon: "ShoppingCart",
    },
    {
      title: "Activaciones",
      description: "Exportar historial de activaciones de servidores",
      endpoint: "/api/export/activations",
      icon: "Server",
    },
    {
      title: "Historial de descargas",
      description: "Exportar historial de descargas por usuario, producto y versión",
      endpoint: "/api/export/downloads",
      icon: "Download",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Exportar Datos</h1>
      
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {exportOptions.map((option) => (
          <a
            key={option.endpoint}
            href={`${option.endpoint}?format=csv`}
            className="bg-[#111] rounded-xl border border-[#333] p-6 hover:border-[#f59e0b]/50 transition-colors group"
          >
            <h3 className="text-white font-medium text-lg mb-2 group-hover:text-[#f59e0b] transition-colors">
              {option.title}
            </h3>
            <p className="text-gray-500 text-sm">{option.description}</p>
            <div className="mt-4 text-[#f59e0b] text-sm font-medium">Descargar CSV ↓</div>
          </a>
        ))}
      </div>

      <div className="mt-8 bg-[#111] rounded-xl border border-[#333] p-6">
        <h2 className="text-white font-medium mb-4">Acerca de la exportación</h2>
        <ul className="text-gray-400 text-sm space-y-2">
          <li>• Los archivos se exportan en formato CSV</li>
          <li>• El límite máximo es de 10,000 registros por exportación</li>
          <li>• Los datos incluyen todos los campos relevantes del sistema</li>
          <li>• Puede agregar filtros usando los parámetros de URL</li>
        </ul>
      </div>
    </div>
  );
}
