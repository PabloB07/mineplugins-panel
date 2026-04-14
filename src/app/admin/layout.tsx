import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const isAdmin =
    session.user?.role === "ADMIN" || session.user?.role === "SUPER_ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNavbar user={session.user} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}