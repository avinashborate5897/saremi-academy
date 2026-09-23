import React, { useState } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  Download,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Product, PurchasedProduct } from '@/src/types';
import { useAuth } from '@/src/context/AuthContext';
import { savePurchasedProduct, triggerTransactionalNotification } from '@/src/lib/firestoreService';

interface DigitalCheckoutModalProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: (purchase: PurchasedProduct) => void;
}

export const DigitalCheckoutModal: React.FC<DigitalCheckoutModalProps> = ({
  product,
  onClose,
  onSuccess
}) => {
  const { user, profile } = useAuth();
  const [customerName, setCustomerName] = useState(profile?.name || user?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!product) return null;

  const price = product.salePrice || product.price;
  const currencySymbol = product.currency === 'USD' ? '$' : '₹';

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerEmail || !customerName) {
      setErrorMessage('Please enter your full name and email address to receive your digital download.');
      return;
    }

    setIsProcessing(true);

    try {
      const orderId = `store_ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      // Step 1: Request Razorpay Order from server endpoint
      const orderResponse = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: price,
          currency: product.currency || 'INR',
          customerEmail,
          customerName,
          notes: {
            productId: product.id,
            productTitle: product.title || product.name,
            productType: 'DIGITAL_PRODUCT'
          }
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Could not initiate secure checkout order with Razorpay.');
      }

      const orderData = await orderResponse.json();
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded && !orderData.isSimulated) {
        throw new Error('Failed to load Razorpay payment SDK. Check your internet connection.');
      }

      // Step 2: Configure Razorpay Checkout options
      const handlePaymentCompletion = async (paymentResponse: {
        razorpay_order_id?: string;
        razorpay_payment_id: string;
        razorpay_signature?: string;
      }) => {
        try {
          // Step 3: Server-side signature & payment verification
          const verifyResponse = await fetch('/api/verify-razorpay-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: paymentResponse.razorpay_order_id || orderData.razorpayOrderId,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature || 'simulated_sig',
              orderId
            })
          });

          const verifyData = await verifyResponse.json();

          if (!verifyData.verified) {
            throw new Error(verifyData.message || 'Payment signature verification failed.');
          }

          // Step 4: Construct verified purchased product record
          const purchaseRecord: PurchasedProduct = {
            id: `purch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            productId: product.id,
            userId: user?.uid,
            userEmail: customerEmail,
            customerName,
            productTitle: product.title || product.name,
            coverImage: product.coverImage || product.imageUrl,
            fileFormat: product.fileFormat || 'Digital PDF Ebook',
            downloadUrl: product.digitalDownloadUrl || product.digitalFileUrl || 'https://storage.googleapis.com/saremi-assets/ebooks/saremi-music-guide.pdf',
            purchaseDate: new Date().toISOString(),
            orderId,
            paymentId: paymentResponse.razorpay_payment_id,
            amountPaid: price,
            currency: product.currency || 'INR'
          };

          // Save to Firestore and user's digital library
          await savePurchasedProduct(purchaseRecord);

          // Dispatch confirmation email
          await triggerTransactionalNotification({
            id: `notif_${Date.now()}`,
            recipientEmail: customerEmail,
            recipientName: customerName,
            subject: `Your Saremi Store Digital Resource: ${product.title || product.name}`,
            type: 'order_confirmation',
            metadata: {
              orderId,
              productTitle: product.title || product.name,
              downloadUrl: purchaseRecord.downloadUrl
            },
            status: 'sent',
            timestamp: new Date().toISOString()
          });

          setIsProcessing(false);
          onSuccess(purchaseRecord);
        } catch (err: any) {
          setIsProcessing(false);
          setErrorMessage(err.message || 'Payment verification failed. Please contact admissions support.');
        }
      };

      // In case of simulated / preview test mode without external Razorpay popup window
      if (orderData.isSimulated || !(window as any).Razorpay) {
        setTimeout(() => {
          handlePaymentCompletion({
            razorpay_order_id: orderData.razorpayOrderId,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_signature: `sig_sim_${Date.now()}`
          });
        }, 800);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Saremi Academy Store',
        description: product.title || product.name,
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=200&q=80',
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone
        },
        theme: {
          color: '#121829'
        },
        handler: function (response: any) {
          handlePaymentCompletion(response);
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setIsProcessing(false);
        setErrorMessage(resp.error?.description || 'Razorpay payment failed or was cancelled.');
      });
      rzp.open();
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Unable to process checkout. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div
        id="digital-checkout-modal"
        className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full text-left relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-[#121829] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-[#D49A3D] text-xs font-bold uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Direct Digital Checkout</span>
          </div>

          <h3 className="font-serif text-xl font-bold">
            Complete Your Digital Purchase
          </h3>
          <p className="text-xs text-gray-300 mt-1">
            Instant PDF download & permanent access in your Saremi Library.
          </p>
        </div>

        {/* Product Summary Row */}
        <div className="p-6 bg-[#FAF8F5] border-b border-gray-200/80 flex items-center gap-4">
          <img
            src={product.coverImage || product.imageUrl}
            alt={product.title || product.name}
            className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-xs"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase text-[#8C6428]">
              {product.fileFormat || 'Digital Ebook'}
            </span>
            <h4 className="font-serif font-bold text-sm text-[#121829] truncate">
              {product.title || product.name}
            </h4>
            <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3" />
              <span>Instant Digital Unlock</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-serif font-bold text-lg text-[#121829]">
              {currencySymbol}{price}
            </div>
            <span className="text-[10px] text-gray-400">Total Price</span>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleStartPayment} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Your Full Name *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:border-[#D49A3D] focus:ring-1 focus:ring-[#D49A3D]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Email Address for Digital Delivery *
            </label>
            <input
              type="email"
              required
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="e.g. rahul@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:border-[#D49A3D] focus:ring-1 focus:ring-[#D49A3D]"
            />
            <span className="text-[11px] text-gray-500 mt-1 block">
              We'll send your download link and invoice to this email.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              WhatsApp / Mobile Number (Optional)
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91 85911 74823"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:border-[#D49A3D] focus:ring-1 focus:ring-[#D49A3D]"
            />
          </div>

          <div className="pt-2">
            <button
              id="proceed-razorpay-btn"
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-xl bg-[#121829] hover:bg-[#D49A3D] text-white hover:text-[#121829] font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Payment with Razorpay...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#D49A3D]" />
                  <span>Pay {currencySymbol}{price} via Razorpay</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Razorpay Gateway • Direct Digital Access</span>
          </div>
        </form>
      </div>
    </div>
  );
};
