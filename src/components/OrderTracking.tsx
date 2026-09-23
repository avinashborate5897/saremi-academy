import React, { useEffect, useState } from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Sparkles,
  MapPin,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { Order, OrderStatus } from '@/src/types';
import { subscribeToOrder, updateOrderStatus } from '@/src/lib/firestoreService';
import { useAuth } from '@/src/context/AuthContext';

interface OrderTrackingProps {
  orderId: string;
  onBackToDashboard: () => void;
}

const PHYSICAL_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'order_placed', label: 'Order Placed', desc: 'Received & logged into system' },
  { status: 'payment_confirmed', label: 'Payment Confirmed', desc: 'Verified via Razorpay' },
  { status: 'preparing', label: 'Preparing & Packing', desc: 'Carefully packed by hand in our studio' },
  { status: 'shipped', label: 'Shipped', desc: 'Dispatched with carrier tracking' },
  { status: 'out_for_delivery', label: 'Out for Delivery', desc: 'Courier en route to your address' },
  { status: 'delivered', label: 'Delivered', desc: 'Package safely delivered' }
];

const DIGITAL_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'order_placed', label: 'Order Placed', desc: 'Received & logged into system' },
  { status: 'payment_confirmed', label: 'Payment Confirmed', desc: 'Verified via Razorpay' },
  { status: 'enrolled', label: 'Enrolled / Access Granted', desc: 'Live studio link & downloads active' }
];

export const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId, onBackToDashboard }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToOrder(orderId, (updatedOrder) => {
      setOrder(updatedOrder);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 text-[#D49A3D] animate-spin mx-auto mb-3" />
        <p className="font-serif text-lg text-[#121829]">Connecting to live order stream...</p>
        <p className="text-xs text-gray-500 mt-1">Listening for real-time Firestore updates</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="font-serif text-2xl font-bold text-[#121829]">Order Not Found</h3>
        <p className="text-sm text-gray-500 mt-2">
          Could not locate order #{orderId}. It may have been created under another profile or cancelled.
        </p>
        <button
          onClick={onBackToDashboard}
          className="mt-6 px-6 py-2.5 rounded-full bg-[#121829] text-white text-xs font-bold hover:bg-[#1D2640]"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isDigitalOnly = order.orderType === 'digital';
  const steps = isDigitalOnly ? DIGITAL_STEPS : PHYSICAL_STEPS;
  const currentStepIndex = steps.findIndex((s) => s.status === order.status);

  // Admin simulation helper to advance status live
  const handleAdvanceStatus = async (nextStatus: OrderStatus) => {
    await updateOrderStatus(order.id, nextStatus, `Live update triggered by admin.`);
  };

  return (
    <section className="py-12 sm:py-16 bg-[#FAF8F5] min-h-[80vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBackToDashboard}
            className="text-xs font-bold text-[#5F667B] hover:text-[#121829] flex items-center gap-1.5"
          >
            ← Back to Dashboard & Orders
          </button>

          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs px-3 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Firestore Live Listener Active</span>
          </div>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#121829]/10 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[#8C6428] font-bold">
                  Order Details
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
                  {order.id.slice(0, 12)}...
                </span>
                <button
                  onClick={copyOrderId}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Copy full Order ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121829] mt-1">
                Status:{' '}
                <span className="capitalize text-[#8C6428]">
                  {order.status.replace(/_/g, ' ')}
                </span>
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-500">Order Total</div>
              <div className="font-serif font-bold text-2xl text-[#121829]">
                ${order.total.toFixed(2)} USD
              </div>
              <div className="inline-block mt-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Payment: {order.paymentStatus.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Real-Time Timeline */}
          <div className="py-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-6">
              Real-Time Fulfillment Timeline
            </h3>

            <div className="relative pl-6 sm:pl-8 border-l-2 border-gray-200 space-y-8">
              {steps.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.status} className="relative group">
                    {/* Circle Indicator */}
                    <div
                      className={`absolute -left-[31px] sm:-left-[39px] top-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isCurrent
                          ? 'bg-[#D49A3D] text-[#121829] ring-4 ring-[#D49A3D]/20 shadow-md'
                          : isPassed
                          ? 'bg-[#121829] text-white'
                          : 'bg-gray-100 text-gray-400 border border-gray-300'
                      }`}
                    >
                      {isPassed ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-serif font-bold text-base ${
                            isCurrent
                              ? 'text-[#8C6428]'
                              : isPassed
                              ? 'text-[#121829]'
                              : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D49A3D]/20 text-[#8C6428] uppercase tracking-wider">
                            Current Stage
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery or Digital Access Info Box */}
          <div className="mt-4 p-4 rounded-xl bg-[#FAF8F5] border border-[#121829]/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-gray-900 block mb-1">
                {isDigitalOnly ? 'Digital Delivery Confirmation' : 'Shipping Destination'}
              </span>
              {order.shippingAddress ? (
                <div className="text-gray-600 leading-relaxed">
                  <div>{order.shippingAddress.fullName}</div>
                  <div>{order.shippingAddress.line1}</div>
                  {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
                  <div>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </div>
                </div>
              ) : (
                <div className="text-emerald-700">
                  Instant digital fulfillment linked directly to your learner profile.
                </div>
              )}
            </div>

            <div>
              <span className="font-bold text-gray-900 block mb-1">
                {isDigitalOnly ? 'Classroom Access Key' : 'Estimated Arrival'}
              </span>
              <div className="font-serif text-base font-bold text-[#121829]">
                {order.estimatedDelivery || 'Immediate Access'}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {isDigitalOnly
                  ? 'Your virtual 1:1 studio link has been unlocked in your dashboard.'
                  : 'Delivered in padded instrument-safe acoustic packing.'}
              </p>
            </div>
          </div>

          {/* Admin Live Tester Trigger */}
          {isAdmin && (
            <div className="mt-8 pt-6 border-t border-gray-100 bg-amber-50/70 p-4 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Admin Real-Time Push Controls (Testing Live onSnapshot)
                </span>
                <span className="text-[10px] text-amber-700 font-mono">Logged in as Staff Admin</span>
              </div>
              <p className="text-xs text-amber-800 mb-3">
                Click any step to push a live status update to Firestore. The timeline above will update instantly without page reload!
              </p>
              <div className="flex flex-wrap gap-2">
                {steps.map((s) => (
                  <button
                    key={s.status}
                    onClick={() => handleAdvanceStatus(s.status)}
                    disabled={order.status === s.status}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      order.status === s.status
                        ? 'bg-[#121829] text-white opacity-50 cursor-default'
                        : 'bg-white text-[#121829] border border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    → Mark {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Line Items Breakdown */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#121829]/10 shadow-sm text-left">
          <h3 className="font-serif text-xl font-bold text-[#121829] mb-4">Purchased Items</h3>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#121829]">{item.title}</h4>
                    <span className="text-[10px] text-gray-500 capitalize">
                      Quantity: {item.quantity} • {item.type}
                    </span>
                  </div>
                </div>
                <div className="font-serif font-bold text-sm text-[#121829]">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
