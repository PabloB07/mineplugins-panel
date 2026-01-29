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
    <div className="min-h-screen bg-zinc-950">
      {/* Admin Navigation */}
      <nav className="bg-gray-800 border-b border-yellow-600/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-xl font-bold text-white">
                TownyFaiths
              </Link>
              <span className="bg-yellow-600 text-yellow-100 text-xs px-2 py-1 rounded font-medium">
                ADMIN
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
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
              <div className="text-sm text-gray-400">{session.user.email}</div>
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-yellow-600"
                />
              )}
              <Link
                href="/api/auth/signout"
                className="text-gray-400 hover:text-white text-sm"
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
