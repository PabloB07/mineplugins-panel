import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Download, Package, Calendar, Server, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";

export default async function DownloadsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <DashboardNavbar user={session?.user} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-[#111] rounded-xl border border-[#222] p-8 text-center max-w-md w-full">
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">Access Required</h2>
            <p className="text-gray-400 mb-6">Please login to access your downloads.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[#22c55e] text-black hover:bg-[#16a34a] font-bold py-3 px-6 rounded-lg transition-colors"
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

      {/* Welcome Hero - Gradient Background */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222] mx-4 mt-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
              Downloads & Updates
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              Access your TownyFaiths plugins and updates. Download the latest versions and archived releases.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <Package className="w-4 h-4 mr-2" />
                {licenses.length} Licensed Products
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                <Download className="w-4 h-4 mr-2" />
                Ready to Download
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Download className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8 animate-fade-in pb-10">
        {licenses.length === 0 ? (
          <div className="relative bg-[#111] rounded-xl border border-[#222] p-12 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Active Licenses</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                Purchase a TownyFaiths license to access plugin downloads, updates, and premium support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/buy"
                  className="bg-[#22c55e] text-black hover:bg-[#16a34a] px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 shadow-lg shadow-[#22c55e]/20 inline-block"
                >
                  <Package className="w-5 h-5" />
                  Browse Products
                </Link>
                <Link
                  href="/dashboard"
                  className="bg-[#111] hover:bg-[#151515] text-white font-medium py-3 px-8 rounded-xl border border-[#222] hover:border-[#22c55e]/50 transition-all inline-block"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {licenses.map((license) => {
              const latestVersion = license.product.versions[0];
              const isActive = license.status === "ACTIVE";

              return (
                <div key={license.id} className="group bg-[#111] hover:bg-[#151515] rounded-xl border border-[#222] hover:border-[#22c55e]/50 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-black/20 hover:scale-[1.02] transform">
                  {/* License Header */}
                  <div className="bg-[#151515] px-8 py-6 border-b border-[#222]">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-lg bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e] border border-[#22c55e]/20">
                            <Package className="w-6 h-6" />
                          </div>
                          <h3 className="text-2xl font-bold text-white">
                            {license.product.name}
                          </h3>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
                              isActive
                                ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20"
                                : license.status === "EXPIRED"
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : "bg-gray-700 text-gray-400 border-gray-600"
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
                           <div className="flex items-center gap-2 text-gray-400 group-hover:text-[#22c55e] transition-colors">
                              <Calendar className="w-4 h-4" />
                              <span>Expires: <span className="text-white">{new Date(license.expiresAt).toLocaleDateString()}</span></span>
                           </div>
                           <div className="flex items-center gap-2 text-gray-400 group-hover:text-[#22c55e] transition-colors">
                              <Server className="w-4 h-4" />
                              <span>Activations: <span className="text-white">{license.maxActivations} server(s)</span></span>
                           </div>
                           <div className="font-mono text-xs text-gray-500 bg-[#0a0a0a] px-3 py-1.5 rounded border border-[#222] inline-flex items-center hover:border-[#22c55e]/30 transition-all">
                             {license.licenseKey.slice(0, 16)}...
                           </div>
                         </div>
                      </div>
                    </div>

                    {/* Download Section */}
                    <div className="p-8">
                      {latestVersion ? (
                        <div className="bg-[#0a0a0a] rounded-xl border border-[#222] p-6 hover:border-[#22c55e]/30 transition-all">
                          <div className="flex items-start justify-between mb-6">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-xl font-bold text-white">
                                  Version {latestVersion.version}
                                </h4>
                                {latestVersion.isLatest && (
                                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-bold rounded">
                                    LATEST
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                                <span className="bg-[#111] px-2 py-1 rounded border border-[#222] hover:border-[#22c55e]/30 transition-all">{(latestVersion.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                                {latestVersion.minMcVersion && <span className="bg-[#111] px-2 py-1 rounded border border-[#222] hover:border-[#22c55e]/30 transition-all">MC {latestVersion.minMcVersion}+</span>}
                                {latestVersion.minJavaVersion && <span className="bg-[#111] px-2 py-1 rounded border border-[#222] hover:border-[#22c55e]/30 transition-all">Java {latestVersion.minJavaVersion}+</span>}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {latestVersion.isBeta && (
                                  <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 text-xs rounded">
                                    Beta
                                  </span>
                                )}
                                {latestVersion.isMandatory && (
                                  <span className="px-2 py-0.5 bg-red-500/10 text-red-300 border border-red-500/20 text-xs rounded">
                                    Required Update
                                  </span>
                                )}
                              </div>
                            </div>

                            {latestVersion.changelog && (
                              <div className="mb-6">
                                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <Calendar className="w-3 h-3" />
                                  Change Log
                                </h5>
                                <div className="text-sm text-gray-300 leading-relaxed bg-[#0a0a0a]/50 rounded-lg p-4 border border-[#222] hover:border-[#22c55e]/30 transition-all font-mono">
                                  {latestVersion.changelog}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-4">
                              {isActive ? (
                                <a
                                  href={latestVersion.downloadUrl}
                                  className="inline-flex items-center gap-2 bg-[#22c55e] text-black hover:bg-[#16a34a] font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-[#22c55e]/20"
                                  download
                                >
                                  <Download className="w-5 h-5" />
                                  Download Plugin
                                </a>
                              ) : (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                                  <XCircle className="w-5 h-5 text-red-400" />
                                  <p className="text-red-300 text-sm font-medium">Renew license to download</p>
                                </div>
                              )}
                            </div>
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
                        <details className="mt-8 group">
                          <summary className="cursor-pointer text-gray-400 hover:text-white transition-colors flex items-center gap-2 font-medium select-none">
                            <span className="group-open:rotate-90 transition-transform">▸</span>
                            <span>Previous versions ({license.product.versions.length - 1})</span>
                          </summary>
                          <div className="mt-4 space-y-2 pl-4 border-l border-[#222] ml-1.5">
                            {license.product.versions.slice(1).map((version) => (
                              <div
                                key={version.id}
                                className="group/item flex items-center justify-between p-3 rounded-lg hover:bg-[#151515] transition-colors"
                              >
                                <div>
                                  <div className="text-gray-300 font-medium mb-0.5 group-hover/item:text-[#22c55e] transition-colors">v{version.version}</div>
                                  <div className="text-xs text-gray-500">
                                    {(version.fileSize / 1024 / 1024).toFixed(1)} MB
                                    {version.minMcVersion && ` • MC ${version.minMcVersion}+`}
                                  </div>
                                </div>
                                {isActive ? (
                                  <a
                                    href={version.downloadUrl}
                                    className="text-gray-500 hover:text-[#22c55e] p-2 hover:bg-[#22c55e]/10 rounded-lg transition-all opacity-0 group-hover/item:opacity-100"
                                    title="Download"
                                    download
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                ) : (
                                  <span className="text-gray-600 text-xs">Inactive</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
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