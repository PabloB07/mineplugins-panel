import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Download, Package, Calendar, Server, CheckCircle, XCircle } from "lucide-react";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";

export default async function DownloadsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <DashboardNavbar user={session?.user} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-[#111] rounded-xl border border-neutral-800 p-8 text-center max-w-md w-full">
            <Package className="w-16 h-16 text-neutral-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">Access Required</h2>
            <p className="text-neutral-400 mb-6">Please login to access your downloads.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get user's licenses with products
  const licenses = await prisma.license.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          versions: {
            orderBy: { publishedAt: "desc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DashboardNavbar user={session.user} isAdmin={isAdmin} />

      {/* Header */}
      <div className="border-b border-neutral-800 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
              <Download className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Downloads</h1>
              <p className="text-neutral-400">Access your TownyFaiths plugins and updates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {licenses.length === 0 ? (
          <div className="bg-[#111] rounded-xl border border-neutral-800 p-12 text-center">
            <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-neutral-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No Active Licenses</h3>
            <p className="text-neutral-400 mb-8 max-w-md mx-auto text-lg leading-relaxed">
              Purchase a TownyFaiths license to access plugin downloads, updates, and premium support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/buy"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-green-900/20"
              >
                <Package className="w-5 h-5" />
                Browse Products
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 px-8 rounded-lg transition-all"
              >
                Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8">
            {licenses.map((license) => {
              const latestVersion = license.product.versions[0];
              const isActive = license.status === "ACTIVE";

              return (
                <div key={license.id} className="bg-[#111] rounded-xl border border-neutral-800 overflow-hidden hover:border-neutral-700 transition-all">
                  {/* License Header */}
                  <div className="bg-neutral-900/50 px-8 py-6 border-b border-neutral-800">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h3 className="text-2xl font-bold text-white">
                            {license.product.name}
                          </h3>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${isActive
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : license.status === "EXPIRED"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                  : "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20"
                              }`}
                          >
                            {isActive ? (
                              <><CheckCircle className="w-3 h-3 mr-1.5" /> ACTIVE</>
                            ) : license.status === "EXPIRED" ? (
                              <><XCircle className="w-3 h-3 mr-1.5" /> EXPIRED</>
                            ) : (
                              license.status
                            )}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-6 text-sm">
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Calendar className="w-4 h-4" />
                            <span>Expires: <span className="text-neutral-200">{new Date(license.expiresAt).toLocaleDateString()}</span></span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Server className="w-4 h-4" />
                            <span>Activations: <span className="text-neutral-200">{license.maxActivations} server(s)</span></span>
                          </div>
                          <div className="font-mono text-xs text-neutral-500 bg-[#0a0a0a] px-3 py-1.5 rounded border border-neutral-800 inline-flex items-center">
                            {license.licenseKey.slice(0, 16)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download Section */}
                  <div className="p-8">
                    {latestVersion ? (
                      <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800 p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-xl font-bold text-white">
                                Version {latestVersion.version}
                              </h4>
                              {latestVersion.isLatest && (
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold rounded">
                                  LATEST
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-neutral-400 mb-3">
                              <span className="bg-neutral-900 px-2 py-1 rounded">{(latestVersion.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                              {latestVersion.minMcVersion && <span className="bg-neutral-900 px-2 py-1 rounded">MC {latestVersion.minMcVersion}+</span>}
                              {latestVersion.minJavaVersion && <span className="bg-neutral-900 px-2 py-1 rounded">Java {latestVersion.minJavaVersion}+</span>}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {latestVersion.isBeta && (
                                <span className="px-2 py-1 bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 text-xs rounded">
                                  Beta
                                </span>
                              )}
                              {latestVersion.isMandatory && (
                                <span className="px-2 py-1 bg-red-500/10 text-red-300 border border-red-500/20 text-xs rounded">
                                  Required Update
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {latestVersion.changelog && (
                          <div className="mb-6">
                            <h5 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Change Log</h5>
                            <div className="text-sm text-neutral-300 leading-relaxed bg-[#111] border border-neutral-800 rounded-lg p-4 font-mono">
                              {latestVersion.changelog}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4">
                          {isActive ? (
                            <a
                              href={latestVersion.downloadUrl}
                              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:-translate-y-0.5 shadow-lg shadow-green-900/20"
                              download
                            >
                              <Download className="w-5 h-5" />
                              Download Plugin
                            </a>
                          ) : (
                            <div className="bg-red-900/10 border border-red-900/20 rounded-lg p-4 flex items-center gap-3">
                              <XCircle className="w-5 h-5 text-red-500" />
                              <p className="text-red-400 text-sm font-medium">Renew license to download</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                        <p className="text-neutral-400">No versions available for download</p>
                      </div>
                    )}

                    {/* Previous Versions */}
                    {license.product.versions.slice(1).length > 0 && (
                      <details className="mt-8 group">
                        <summary className="cursor-pointer text-neutral-400 hover:text-white transition-colors flex items-center gap-2 font-medium select-none">
                          <span className="group-open:rotate-90 transition-transform">▸</span>
                          <span>Previous versions ({license.product.versions.length - 1})</span>
                        </summary>
                        <div className="mt-4 space-y-2 pl-4 border-l border-neutral-800 ml-1.5">
                          {license.product.versions.slice(1).map((version) => (
                            <div
                              key={version.id}
                              className="group/item flex items-center justify-between p-3 rounded-lg hover:bg-neutral-900/50 transition-colors"
                            >
                              <div>
                                <div className="text-neutral-300 font-medium mb-0.5">v{version.version}</div>
                                <div className="text-xs text-neutral-500">
                                  {(version.fileSize / 1024 / 1024).toFixed(1)} MB
                                  {version.minMcVersion && ` • MC ${version.minMcVersion}+`}
                                </div>
                              </div>
                              {isActive ? (
                                <a
                                  href={version.downloadUrl}
                                  className="text-neutral-500 hover:text-green-400 p-2 hover:bg-green-500/10 rounded-lg transition-all opacity-0 group-hover/item:opacity-100"
                                  title="Download"
                                  download
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              ) : (
                                <span className="text-neutral-600 text-xs">Inactive</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}