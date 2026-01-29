import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { formatUSD, formatCLP } from "@/lib/pricing";

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
      <div className="min-h-screen bg-zinc-950 text-center py-12">
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
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "FAILED":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "CANCELLED":
        return <XCircle className="w-5 h-5 text-gray-400" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-900/50 text-green-300 border-green-700";
      case "FAILED":
        return "bg-red-900/50 text-red-300 border-red-700";
      case "CANCELLED":
        return "bg-gray-700 text-gray-300 border-gray-600";
      case "PENDING":
        return "bg-yellow-900/50 text-yellow-300 border-yellow-700";
      default:
        return "bg-gray-700 text-gray-300 border-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Success/Error Messages */}
      {success === "true" && (
        <div className="mb-6 bg-emerald-900/50 border border-emerald-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-emerald-300 font-semibold">Payment Successful!</h3>
              <p className="text-emerald-200 text-sm">Your order has been processed successfully.</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
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
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/dashboard/orders"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Order Details</h1>
          <p className="text-gray-400 mt-1">Order #{order.orderNumber}</p>
        </div>
      </div>

      <div className="max-w-4xl">
        {/* Order Status */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
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
            <div>
              <p className="text-sm text-gray-400">Order Date</p>
              <p className="text-white font-medium">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            {order.paidAt && (
              <div>
                <p className="text-sm text-gray-400">Paid Date</p>
                <p className="text-white font-medium">
                  {new Date(order.paidAt).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-400">Payment Method</p>
              <p className="text-white font-medium">Flow.cl</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Items Ordered</h2>
          
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={item.id} className="border-b border-gray-700 pb-4 last:border-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-1">
                      {item.product.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">
                      {item.product.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <span>Duration: {item.durationDays} days</span>
                      <span>Activations: {item.product.maxActivations}</span>
                    </div>
                    
                    {/* License Details */}
                    {item.license && (
                      <div className="mt-4 bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                        <h4 className="text-sm font-semibold text-white mb-2">License Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">License Key:</span>
                            <span className="font-mono text-emerald-400">{item.license.licenseKey}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              item.license.status === "ACTIVE" ? "bg-green-900/50 text-green-300" :
                              item.license.status === "EXPIRED" ? "bg-red-900/50 text-red-300" :
                              "bg-gray-700 text-gray-300"
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
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all"
                          >
                            <Download className="w-4 h-4" />
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
                      {formatCLP(item.unitPriceCLP || item.product.priceCLP)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
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
                      -{formatCLP(discountCLP)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tax</span>
                  <span className="text-white">{formatCLP(0)}</span>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-white">Total</span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-400">
                        {formatUSD(totalUSD)}
                      </div>
                      <div className="text-sm text-gray-300">
                        {formatCLP(totalCLP)}
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