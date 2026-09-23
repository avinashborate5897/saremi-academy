import React from 'react';
import {
  CheckCircle,
  Download,
  BookOpen,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Library
} from 'lucide-react';
import { PurchasedProduct } from '@/src/types';
import { useRouter } from '@/src/router/RouterContext';

interface PurchaseSuccessModalProps {
  purchase: PurchasedProduct | null;
  onClose: () => void;
  onGoToLibrary: () => void;
}

export const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
  purchase,
  onClose,
  onGoToLibrary
}) => {
  const { navigate } = useRouter();

  if (!purchase) return null;

  const handleDownload = () => {
    if (purchase.downloadUrl) {
      // Direct file trigger
      const link = document.createElement('a');
      link.href = purchase.downloadUrl;
      link.download = `${purchase.productTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        id="purchase-success-modal"
        className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full text-center p-6 sm:p-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Animated Celebration Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#D49A3D]" />
          <span>Payment Verified Successfully</span>
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121829]">
          🎉 Purchase Successful!
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          Thank you for purchasing from <span className="font-bold text-[#121829]">Saremi Store</span>.
        </p>

        {/* Product Card Highlight */}
        <div className="my-6 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8] text-left flex items-center gap-4">
          <img
            src={purchase.coverImage}
            alt={purchase.productTitle}
            className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-xs"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase text-[#8C6428]">
              {purchase.fileFormat}
            </span>
            <h4 className="font-serif font-bold text-sm text-[#121829] line-clamp-1">
              {purchase.productTitle}
            </h4>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Receipt ID: <span className="font-mono text-gray-700 font-medium">#{purchase.orderId.slice(-8).toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-serif text-base font-bold text-[#121829]">
            Your digital product is ready.
          </p>

          {/* Download Primary CTA */}
          <button
            id="download-product-btn"
            onClick={handleDownload}
            className="w-full py-3.5 px-6 rounded-xl bg-[#121829] hover:bg-[#D49A3D] text-white hover:text-[#121829] font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download {purchase.fileFormat || 'Ebook'}</span>
          </button>

          {/* Go to My Library CTA */}
          <button
            id="go-to-library-btn"
            onClick={() => {
              onClose();
              onGoToLibrary();
            }}
            className="w-full py-3 px-6 rounded-xl bg-[#FAF8F5] hover:bg-gray-100 border border-gray-300 text-xs font-bold text-[#121829] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Library className="w-4 h-4 text-[#8C6428]" />
            <span>Open in My Library</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-gray-500">
          A copy has also been sent to <span className="font-semibold text-gray-700">{purchase.userEmail}</span>.
        </div>
      </div>
    </div>
  );
};
