import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-white">
                MinePlugins
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/licenses"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Licenses
              </Link>
              <Link
                href="/dashboard/downloads"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Downloads
              </Link>
              {isAdmin && (
                <>
                  <span className="text-gray-600">|</span>
                  <Link
                    href="/admin"
                    className="text-yellow-400 hover:text-yellow-300 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin Panel
                  </Link>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                {session.user.email}
              </div>
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
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
