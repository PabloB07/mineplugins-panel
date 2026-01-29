import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import Pricing from "@/components/sections/Pricing";
import Testimonials from "@/components/sections/Testimonials";
import HostedBy from "@/components/sections/HostedBy";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
        <HostedBy />
      </main>
      <Footer />
    </div>
  );
}
