import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MinecraftIcon } from "@/components/ui/MinecraftIcon";

interface PageProps {
  searchParams: Promise<{
    orderNumber?: string;
    order_id?: string;
    status?: string;
  }>;
}

export default async function PaymentSuccessPage(props: PageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/payment/success");
  }

  const params = await props.searchParams;
  const { orderNumber, order_id, status } = params;

  let order = null;

  if (orderNumber) {
    order = await prisma.order.findFirst({
      where: {
        orderNumber,
        user: { email: session.user.email },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  if (order_id && !order) {
    order = await prisma.order.findUnique({
      where: { id: order_id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  const isSuccess = status === "success" || order?.status === "COMPLETED";

  if (isSuccess && order) {
    redirect(`/dashboard?payment=success&order=${order.orderNumber}`);
  }

  if (!isSuccess) {
    redirect(`/dashboard?payment=pending&order=${order?.orderNumber || ""}`);
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>}>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 text-center">
          <div className="mb-6">
            <MinecraftIcon sprite="emerald-block" scale={4} className="mx-auto" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            {isSuccess ? "Payment Successful!" : "Payment Pending"}
          </h1>

          <p className="text-gray-400 mb-6">
            {isSuccess
              ? "Your payment has been processed. Your license has been activated."
              : "Your payment is being processed. This may take a few minutes."}
          </p>

          {order && (
            <div className="bg-gray-900/50 rounded-xl p-4 mb-6 text-left">
              <div className="text-sm text-gray-400 mb-1">Order Number</div>
              <div className="text-white font-mono mb-3">#{order.orderNumber}</div>

              <div className="text-sm text-gray-400 mb-1">Product</div>
              <div className="text-white mb-3">
                {order.items[0]?.product.name || "Unknown Product"}
              </div>

              <div className="text-sm text-gray-400 mb-1">Amount</div>
              <div className="text-white">
                {order.currency === "CLP"
                  ? `$${order.total.toLocaleString("es-CL")} CLP`
                  : `$${order.total.toFixed(2)} USD`}
              </div>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
}