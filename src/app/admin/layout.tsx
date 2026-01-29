import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Check if user is admin
  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Admin Navigation */}
      <nav className="bg-[#1a1a1a] border-b border-[#f59e0b]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-xl font-bold text-white">
                TownyFaiths
              </Link>
              <span className="bg-[#f59e0b] text-[#fffbeb] text-xs px-3 py-1 rounded font-medium border border-[#f59e0b]/20">
                ADMIN
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-[#a3a3a3] hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/products"
                className="text-[#a3a3a3] hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Products
              </Link>
              <Link
                href="/admin/orders"
                className="text-[#a3a3a3] hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Orders
              </Link>
              <Link
                href="/admin/licenses"
                className="text-[#a3a3a3] hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Licenses
              </Link>
              <Link
                href="/admin/users"
                className="text-[#a3a3a3] hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Users
              </Link>
              <Link
                href="/admin/activity"
                className="text-[#a3a3a3] hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Activity
              </Link>
              <Link
                href="/admin/analytics"
                className="text-[#a3a3a3] hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Analytics
              </Link>
              <span className="text-[#404040]">|</span>
              <Link
                href="/admin/payku"
                className="text-[#3b82f6] hover:text-[#60a5fa] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Payku
              </Link>
              <span className="text-[#404040]">|</span>
              <Link
                href="/dashboard"
                className="text-[#3b82f6] hover:text-[#60a5fa] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Customer View
              </Link>
              <Link
                href="/admin/products"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Products
              </Link>
              <Link
                href="/admin/orders"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Orders
              </Link>
              <Link
                href="/admin/licenses"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Licenses
              </Link>
              <Link
                href="/admin/users"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Users
              </Link>
              <Link
                href="/admin/activity"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Activity
              </Link>
              <Link
                href="/admin/analytics"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Analytics
              </Link>
              <Link
                href="/admin/payku"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Payku
              </Link>
              <span className="text-gray-600">|</span>
              <Link
                href="/dashboard"
                className="text-blue-400 hover:text-blue-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Customer View
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-[#737373]">{session.user.email}</div>
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-[#f59e0b]"
                />
              )}
              <Link
                href="/api/auth/signout"
                className="text-[#737373] hover:text-white text-sm transition-colors"
              >
                Sign out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
