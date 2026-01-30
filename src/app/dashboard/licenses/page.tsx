import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  Server, 
  Globe, 
  CheckCircle, 
  XCircle,
  Calendar,
  Zap,
  Activity
} from "lucide-react";

type License = {
  id: string;
  licenseKey: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  lastValidatedAt: Date | null;
  maxActivations: number;
  product: {
    name: string;
    slug: string;
  };
  activations: Array<{
    id: string;
    serverId: string;
    serverIp: string | null;
    isActive: boolean;
    lastSeenAt: Date;
    serverVersion: string | null;
    validationCount: number;
  }>;
};

export default async function LicensesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const licenses = await prisma.license.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: { name: true, slug: true },
      },
      activations: {
        select: {
          id: true,
          serverId: true,
          serverIp: true,
          isActive: true,
          lastSeenAt: true,
          serverVersion: true,
          validationCount: true,
        },
        orderBy: { lastSeenAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Licenses</h1>
          <p className="text-gray-400 mt-1">
            Manage your TownyFaiths plugin licenses
          </p>
        </div>
        <Link
          href="/buy"
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Buy New License
        </Link>
      </div>

      {/* Licenses Grid */}
      {licenses.length === 0 ? (
        <div className="bg-[#111] rounded-xl border border-[#222] p-16 text-center">
          <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-gray-500" />
          </div>
          <div className="text-gray-400 mb-4 text-lg">
            You don&apos;t have any licenses yet.
          </div>
          <Link
            href="/buy"
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-green-600/20 inline-block"
          >
            Purchase Your First License
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {licenses.map((license) => {
            const isExpired = new Date() > new Date(license.expiresAt);
            const daysLeft = Math.ceil(
              (new Date(license.expiresAt).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            );
            const activeActivations = license.activations.filter(
              (a: { isActive: boolean }) => a.isActive
            ).length;

            return (
              <div
                key={license.id}
                className="bg-[#111] rounded-xl border border-[#222] overflow-hidden hover:border-green-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/20"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {license.product.name}
                      </h3>
                      <p className="text-gray-400 text-sm font-mono mt-1">
                        {license.licenseKey.substring(0, 20)}...
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                        license.status === "ACTIVE" && !isExpired
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : license.status === "EXPIRED" || isExpired
                          ? "bg-red-500/20 text-red-300 border-red-500/30"
                          : license.status === "SUSPENDED"
                          ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          : "bg-gray-700 text-gray-300 border-gray-600"
                      }`}
                    >
                      {isExpired ? "EXPIRED" : license.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#333]">
                      <div className="text-gray-400 text-xs mb-1">Created</div>
                      <div className="text-white font-medium">
                        {new Date(license.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#333]">
                      <div className="text-gray-400 text-xs mb-1">Expires</div>
                      <div
                        className={`font-medium ${
                          isExpired ? "text-red-400" : "text-white"
                        }`}
                      >
                        {new Date(license.expiresAt).toLocaleDateString()}
                        {!isExpired && daysLeft <= 30 && (
                          <span className="text-yellow-400 ml-2 text-sm">
                            ({daysLeft} days left)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#333]">
                      <div className="text-gray-400 text-xs mb-1">Activations</div>
                      <div className="text-white font-medium">
                        {activeActivations} / {license.maxActivations}
                      </div>
                    </div>
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#333]">
                      <div className="text-gray-400 text-xs mb-1">Last Validated</div>
                      <div className="text-white font-medium">
                        {license.lastValidatedAt
                          ? new Date(
                              license.lastValidatedAt
                            ).toLocaleDateString()
                          : "Never"}
                      </div>
                    </div>
                  </div>

                  {/* Server Activations */}
                  {license.activations.length > 0 && (
                    <div className="border-t border-[#222] pt-4 mt-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                        <Server className="w-4 h-4" />
                        Active Servers ({license.activations.length})
                      </div>
                      <div className="space-y-3">
                        {license.activations.slice(0, 3).map((activation) => (
                          <div
                            key={activation.id}
                            className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#333] hover:border-[#444] transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {activation.isActive ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-gray-500" />
                                )}
                                <div>
                                  <div className="text-white text-sm font-mono">
                                    Server {activation.serverId.substring(0, 12)}...
                                  </div>
                                  {activation.serverIp && (
                                    <div className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                                      <Globe className="w-3 h-3" />
                                      {activation.serverIp}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                activation.isActive
                                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                  : "bg-gray-700/50 text-gray-300 border border-gray-600"
                              }`}>
                                {activation.isActive ? "Active" : "Inactive"}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              {activation.serverVersion && (
                                <div className="flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  v{activation.serverVersion}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                {activation.validationCount} validations
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(activation.lastSeenAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                        {license.activations.length > 3 && (
                          <div className="text-center">
                            <Link
                              href={`/dashboard/licenses/${license.id}`}
                              className="text-gray-400 hover:text-green-400 text-sm inline-flex items-center gap-1 transition-colors"
                            >
                              +{license.activations.length - 3} more servers →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-[#0a0a0a]/50 px-6 py-3 flex justify-between items-center border-t border-[#222]">
                  <Link
                    href={`/dashboard/licenses/${license.id}`}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors inline-flex items-center gap-1"
                  >
                    View Details →
                  </Link>
                  <button className="text-gray-400 hover:text-white text-sm transition-colors px-3 py-1 rounded-lg hover:bg-[#333]">
                    Copy License Key
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
