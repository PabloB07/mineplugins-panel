import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Download, Package, Calendar, Server, CheckCircle, XCircle } from "lucide-react";

export default async function DownloadsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center max-w-md">
          <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Access Required</h2>
          <p className="text-gray-400 mb-6">Please login to access your downloads.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Sign In
          </Link>
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

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Downloads</h1>
              <p className="text-gray-400">Access your TownyFaiths plugins and updates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {licenses.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-12 text-center">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No Active Licenses</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto text-lg">
              Purchase a TownyFaiths license to access plugin downloads, updates, and premium support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/buy"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <Package className="w-5 h-5" />
                Browse Products
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-8 rounded-lg transition-all"
              >
                Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {licenses.map((license) => {
              const latestVersion = license.product.versions[0];
              const isActive = license.status === "ACTIVE";

              return (
                <div key={license.id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all">
                  {/* License Header */}
                  <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-5 border-b border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className="text-xl font-bold text-white">
                            {license.product.name}
                          </h3>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              isActive
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : license.status === "EXPIRED"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                            }`}
                          >
                            {isActive ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> ACTIVE</>
                            ) : license.status === "EXPIRED" ? (
                              <><XCircle className="w-3 h-3 mr-1" /> EXPIRED</>
                            ) : (
                              license.status
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Expires: {new Date(license.expiresAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Server className="w-4 h-4" />
                            <span>Activations: {license.maxActivations} server(s)</span>
                          </div>
                          <div className="font-mono text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded inline-flex items-center">
                            {license.licenseKey.slice(0, 12)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download Section */}
                  <div className="p-6">
                    {latestVersion ? (
                      <div className="bg-gray-700/30 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h4 className="text-lg font-semibold text-white mb-2">
                              Version {latestVersion.version}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                              <span>Size: {(latestVersion.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                              {latestVersion.minMcVersion && <span>MC {latestVersion.minMcVersion}+</span>}
                              {latestVersion.minJavaVersion && <span>Java {latestVersion.minJavaVersion}+</span>}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {latestVersion.isBeta && (
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs rounded-full">
                                  Beta
                                </span>
                              )}
                              {latestVersion.isLatest && (
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs rounded-full">
                                  Latest Release
                                </span>
                              )}
                              {latestVersion.isMandatory && (
                                <span className="px-2 py-1 bg-red-500/20 text-red-300 border border-red-500/30 text-xs rounded-full">
                                  Required Update
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {latestVersion.changelog && (
                          <div className="mb-6">
                            <h5 className="text-sm font-medium text-gray-300 mb-2">What's New</h5>
                            <p className="text-sm text-gray-400 leading-relaxed bg-gray-800/50 rounded-lg p-4">
                              {latestVersion.changelog}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-4">
                          {isActive ? (
                            <a
                              href={latestVersion.downloadUrl}
                              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
                              download
                            >
                              <Download className="w-5 h-5" />
                              Download Plugin
                            </a>
                          ) : (
                            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                              <XCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                              <p className="text-gray-400 text-sm">License inactive - download unavailable</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">No versions available for download</p>
                      </div>
                    )}

                    {/* Previous Versions */}
                    {license.product.versions.slice(1).length > 0 && (
                      <details className="mt-6 group">
                        <summary className="cursor-pointer text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                          <span>Previous versions ({license.product.versions.length - 1})</span>
                          <span className="group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="mt-4 space-y-3">
                          {license.product.versions.slice(1).map((version) => (
                            <div
                              key={version.id}
                              className="bg-gray-700/20 rounded-lg p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                            >
                              <div>
                                <div className="text-white font-medium mb-1">v{version.version}</div>
                                <div className="text-sm text-gray-400">
                                  {(version.fileSize / 1024 / 1024).toFixed(1)} MB
                                  {version.minMcVersion && ` • MC ${version.minMcVersion}+`}
                                </div>
                              </div>
                              {isActive ? (
                                <a
                                  href={version.downloadUrl}
                                  className="text-blue-400 hover:text-blue-300 p-2 hover:bg-gray-600/50 rounded-lg transition-all"
                                  download
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              ) : (
                                <span className="text-gray-500 text-xs">Inactive</span>
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