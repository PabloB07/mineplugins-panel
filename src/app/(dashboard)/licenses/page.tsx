import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
    isActive: boolean;
    lastSeenAt: Date;
    serverVersion: string | null;
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
          isActive: true,
          lastSeenAt: true,
          serverVersion: true,
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
            Manage your licenses
          </p>
        </div>
        <Link
          href="/store"
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200"
        >
          Buy New License
        </Link>
      </div>

      {/* Licenses Grid */}
      {licenses.length === 0 ? (
        <div className="bg-[#111] rounded-xl border border-[#222] p-12 text-center">
          <div className="text-gray-400 mb-4">
            You don&apos;t have any licenses yet.
          </div>
          <Link
            href="/store"
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 inline-block"
          >
            Purchase Your First License
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {licenses.map((license: License) => {
            const isExpired = new Date() > new Date(license.expiresAt);
            const activeActivations = license.activations.filter(
              (a: { isActive: boolean }) => a.isActive
            ).length;

            return (
              <div
                key={license.id}
                className="bg-[#111] rounded-xl border border-[#222] overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {license.product.name}
                      </h3>
                      <p className="text-gray-400 text-sm font-mono mt-1">
                        {license.licenseKey.substring(0, 20)}...
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        license.status === "ACTIVE" && !isExpired
                          ? "bg-green-500/15 text-green-400 border border-green-500/20"
                          : license.status === "EXPIRED" || isExpired
                          ? "bg-red-500/15 text-red-400 border border-red-500/20"
                          : license.status === "SUSPENDED"
                          ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                          : "bg-[#181818] text-gray-300 border border-[#333]"
                      }`}
                    >
                      {isExpired ? "EXPIRED" : license.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-gray-400 text-sm">Created</div>
                      <div className="text-white">
                        {new Date(license.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Expires</div>
                      <div
                        className={
                          isExpired ? "text-red-400" : "text-white"
                        }
                      >
                        {new Date(license.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Activations</div>
                      <div className="text-white">
                        {activeActivations} / {license.maxActivations}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Last Validated</div>
                      <div className="text-white">
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
                      <div className="text-gray-400 text-sm mb-2">
                        Active Servers
                      </div>
                      <div className="space-y-2">
                        {license.activations.slice(0, 3).map((activation: License['activations'][0]) => (
                          <div
                            key={activation.id}
                            className="flex items-center justify-between text-sm bg-[#181818] rounded px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  activation.isActive
                                    ? "bg-green-400"
                                    : "bg-gray-500"
                                }`}
                              />
                              <span className="text-gray-300 font-mono">
                                {activation.serverId.substring(0, 12)}...
                              </span>
                            </div>
                            <div className="text-gray-400">
                              v{activation.serverVersion || "unknown"} - Last
                              seen{" "}
                              {new Date(
                                activation.lastSeenAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                        {license.activations.length > 3 && (
                          <div className="text-gray-400 text-sm">
                            +{license.activations.length - 3} more servers
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-[#181818] px-6 py-3 flex justify-between items-center">
                  <Link
                    href={`/dashboard/licenses/${license.id}`}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    View Details
                  </Link>
                  <button className="text-gray-400 hover:text-white text-sm">
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
