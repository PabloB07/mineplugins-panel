import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import Testimonials from "@/components/sections/Testimonials";
import HostedBy from "@/components/sections/HostedBy";
import CTASection from "@/components/sections/CTASection";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  // If user is logged in, show dashboard view on homepage
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <HostedBy />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
