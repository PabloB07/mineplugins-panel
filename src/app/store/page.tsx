import { auth } from "@/lib/auth";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import StoreContent from "@/components/store/StoreContent";

export default async function BuyPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Header />
      <div className="pt-24 pb-20 lg:pt-32 lg:pb-28 flex-1">
        <StoreContent session={session} />
      </div>
      <Footer />
    </div>
  );
}
