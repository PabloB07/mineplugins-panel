import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DashboardNavbar user={session.user} isAdmin={isAdmin} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
