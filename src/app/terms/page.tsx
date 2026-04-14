import { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Terms of Service - MinePlugins",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <Icon name="ArrowLeft" className="w-4 h-4" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service - MinePlugins</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using TownyFaith, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Use License</h2>
            <p>Permission is granted to use TownyFaith services for personal, non-commercial use only. This is the grant of a license, not a transfer of title.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Disclaimer</h2>
            <p>The services are provided &quot;as is&quot;. TownyFaith makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Limitations</h2>
            <p>TownyFaith shall not be held liable for any damages arising out of the use or inability to use the materials on the website.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Account Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your device.</p>
          </section>
        </div>
      </div>
    </div>
  );
}