import { Metadata } from "next";
import Link from "next/link";
import { useIcon } from "@/hooks/useIcon";

export const metadata: Metadata = {
  title: "Privacy Policy - MinePlugins",
};

export default function PrivacyPage() {
  const ArrowLeft = useIcon("ArrowLeft");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy - MinePlugins</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including name, email, and payment information when making purchases.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. How We Use Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, and to communicate with you about your purchases and account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Information Sharing</h2>
            <p>We do not sell, trade, or otherwise transfer your personal information to outside parties except as necessary to provide our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Contact Information</h2>
            <p>If you have any questions about this privacy policy, please contact us through our support channels.</p>
          </section>
        </div>
      </div>
    </div>
  );
}