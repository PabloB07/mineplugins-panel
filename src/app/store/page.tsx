import { auth } from "@/lib/auth";
import Header from "@/components/ui/Header";
import StoreContent from "@/components/store/StoreContent";

export default async function BuyPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <div className="pt-24 pb-20 lg:pt-32 lg:pb-28">
        <StoreContent session={session} />
      </div>
    </div>
  );
}
