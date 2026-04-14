import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import HostedBy from "@/components/sections/HostedBy";
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
        <HostedBy />
      </main>
      <Footer />
    </div>
  );
}
