import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaykuSettingsForm } from "@/components/admin/PaykuSettingsForm";

export default async function PaykuSettingsPage() {
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

  // Get Payku settings (you could store these in a settings table)
  const paykuSettings = {
    enabled: process.env.PAYKU_API_TOKEN && process.env.PAYKU_SECRET_KEY ? true : false,
    apiUrl: process.env.NODE_ENV === "production" ? "https://api.payku.cl" : "https://sandbox.payku.cl",
    hasApiToken: !!process.env.PAYKU_API_TOKEN,
    hasSecretKey: !!process.env.PAYKU_SECRET_KEY,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Payku Payment Settings</h1>
        <p className="text-gray-400">
          Configure Payku payment integration settings
        </p>
      </div>

      <PaykuSettingsForm settings={paykuSettings} />
    </div>
  );
}