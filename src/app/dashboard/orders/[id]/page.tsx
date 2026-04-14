import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { formatUSD, formatCLPValue } from "@/lib/pricing";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function OrderPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const { success, error } = await searchParams;

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-gray-400">Please login to view your order details.</p>
      </div>
    );
  }

  // Get order details
  const order = await prisma.order.findFirst({
    where: { 
      id,
      userId: session.user.id // Ensure user can only view their own orders
    },
    include: {
      items: {
        include: {
          product: true,
          license: {
            select: { 
              id: true, 
              licenseKey: true, 
              status: true, 
              expiresAt: true,
              maxActivations: true,
              createdAt: true
            }
          }
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Icon name="CheckCircle" className="w-5 h-5 text-green-400" />;
      case "FAILED":
        return <Icon name="XCircle" className="w-5 h-5 text-red-400" />;
      case "CANCELLED":
        return <Icon name="XCircle" className="w-5 h-5 text-gray-400" />;
      case "PENDING":
        return <Icon name="Clock" className="w-5 h-5 text-yellow-400" />;
      default:
        return <Icon name="AlertCircle" className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30";
      case "FAILED":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "CANCELLED":
        return "bg-[#1a1a1a] text-gray-300 border-[#333]";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      default:
        return "bg-[#1a1a1a] text-gray-300 border-[#333]";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Success/Error Messages */}
      {success === "true" && (
        <div className="bg-emerald-900/50 border border-emerald-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Icon name="CheckCircle" className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-emerald-300 font-semibold">Payment Successful!</h3>
              <p className="text-emerald-200 text-sm">Your order has been processed successfully.</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Icon name="XCircle" className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-red-300 font-semibold">Payment Issue</h3>
              <p className="text-red-200 text-sm">
                {error === "payment_rejected" && "Your payment was rejected. Please try again."}
                {error === "payment_cancelled" && "Your payment was cancelled."}
                {error === "payment_error" && "There was an error processing your payment."}
                {!["payment_rejected", "payment_cancelled", "payment_error"].includes(error) && 
                  "An error occurred with your payment."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link
              href="/dashboard/orders"
              className="text-gray-400 hover:text-white transition-colors mt-1"
            >
              <Icon name="ArrowLeft" className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Order Details</h1>
              <p className="text-gray-400 mt-2">Order #{order.orderNumber}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full border ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
            <div className="inline-flex items-center px-3 py-2 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
              {order.items.length} Items
            </div>
            <div className="inline-flex items-center px-3 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
              {formatUSD(order.totalUSD || order.items.reduce((sum, item) => sum + (item.unitPriceUSD || 0), 0))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Order Status */}
        <div className="bg-[#111] rounded-xl border border-[#222] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(order.status)}
              <div>
                <h2 className="text-xl font-semibold text-white">Order Status</h2>
                <p className="text-gray-400">{
                  order.status === "COMPLETED" ? "Payment completed and license issued" :
                  order.status === "FAILED" ? "Payment failed" :
                  order.status === "CANCELLED" ? "Payment cancelled" :
                  order.status === "PENDING" ? "Payment pending" :
                  "Unknown status"
                }</p>
              </div>
            </div>
            <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full border ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
              <p className="text-sm text-gray-400">Order Date</p>
              <p className="text-white font-medium">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            {order.paidAt && (
              <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
                <p className="text-sm text-gray-400">Paid Date</p>
                <p className="text-white font-medium">
                  {new Date(order.paidAt).toLocaleDateString()}
                </p>
              </div>
            )}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
              <p className="text-sm text-gray-400">Payment Method</p>
              <p className="text-white font-medium">Flow.cl</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-[#111] rounded-xl border border-[#222] p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Items Ordered</h2>
          
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="border-b border-[#222] pb-4 last:border-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                      {item.product.name}
                      {item.product.icon && (
                        <span className={`icon-minecraft-sm ${item.product.icon}`} />
                      )}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">
                      {item.product.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#0a0a0a] border border-[#222]">
                        Duration: {item.durationDays} days
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#0a0a0a] border border-[#222]">
                        Activations: {item.product.maxActivations}
                      </span>
                    </div>
                    
                    {/* License Details */}
                    {item.license && (
                      <div className="mt-4 bg-[#0a0a0a] rounded-lg p-4 border border-[#222]">
                        <h4 className="text-sm font-semibold text-white mb-2">License Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">License Key:</span>
                            <span className="font-mono text-emerald-400">{item.license.licenseKey}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              item.license.status === "ACTIVE" ? "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30" :
                              item.license.status === "EXPIRED" ? "bg-red-500/15 text-red-400 border border-red-500/30" :
                              "bg-[#181818] text-gray-300 border border-[#333]"
                            }`}>
                              {item.license.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Expires:</span>
                            <span>{new Date(item.license.expiresAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Max Activations:</span>
                            <span>{item.license.maxActivations}</span>
                          </div>
                        </div>
                        
                        {/* Download Button */}
                        <div className="mt-3">
                          <Link
                            href={`/dashboard/licenses/${item.license.id}`}
                            className="inline-flex items-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold py-2 px-4 rounded-lg transition-all"
                          >
                            <Icon name="Download" className="w-4 h-4" />
                            View License
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-emerald-400">
                      {formatUSD(item.unitPriceUSD || item.product.priceUSD)}
                    </div>
                    <div className="text-sm text-gray-300">
                      {formatCLPValue(item.unitPriceCLP || item.product.priceCLP)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-[#111] rounded-xl border border-[#222] p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>
          
          {/* Calculate totals from order items */}
          {(() => {
            const subtotalUSD = order.subtotalUSD || order.items.reduce((sum, item) => sum + (item.unitPriceUSD || 0), 0);
            const subtotalCLP = order.subtotalCLP || order.items.reduce((sum, item) => sum + (item.unitPriceCLP || 0), 0);
            const discountUSD = order.discountUSD || 0;
            const discountCLP = order.discountCLP || 0;
            const totalUSD = order.totalUSD || (subtotalUSD - discountUSD);
            const totalCLP = order.totalCLP || (subtotalCLP - discountCLP);
            
            return (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">
                    {formatUSD(subtotalUSD)}
                  </span>
                </div>
                {discountUSD > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Discount</span>
                    <span className="text-red-400">
                      -{formatUSD(discountUSD)}
                    </span>
                  </div>
                )}
                {discountCLP > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Discount</span>
                    <span className="text-red-400">
                      -{formatCLPValue(discountCLP)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tax</span>
                    <span className="text-white">{formatCLPValue(0)}</span>
                </div>
                <div className="border-t border-[#222] pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-white">Total</span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-400">
                        {formatUSD(totalUSD)}
                      </div>
                      <div className="text-sm text-gray-300">
                        {formatCLPValue(totalCLP)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
