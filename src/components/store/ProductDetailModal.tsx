import React, { useState } from 'react';
import {
  X,
  BookOpen,
  CheckCircle,
  ExternalLink,
  Download,
  Star,
  ShieldCheck,
  Award,
  Sparkles,
  Layers,
  Users,
  Eye,
  ArrowRight
} from 'lucide-react';
import { Product } from '@/src/types';
import { trackAffiliateClick } from '@/src/lib/firestoreService';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onBuyNow
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  if (!product) return null;

  const isDigital = product.type === 'digital' || product.productType === 'DIGITAL_PRODUCT';
  const displayPrice = product.salePrice || product.displayPrice || product.price;
  const originalPrice = product.originalPrice;
  const currencySymbol = product.currency === 'USD' ? '$' : '₹';
  const retailer = product.retailer || 'Amazon';

  const handleExternalAffiliateClick = (retailerName: string, url?: string) => {
    const targetUrl = url || product.affiliateUrl;
    if (targetUrl) {
      trackAffiliateClick(product.id, retailerName, product.category);
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div
        id="product-detail-modal"
        className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto text-left relative my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-gray-100 text-gray-700 shadow-sm border border-gray-200 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Banner / Header Visual */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-b border-gray-100 bg-[#FAF8F5]">
          <div className="md:col-span-5 p-6 flex items-center justify-center bg-white border-b md:border-b-0 md:border-r border-gray-200/70">
            <div className="relative w-full aspect-square max-w-[280px] rounded-xl overflow-hidden shadow-md">
              <img
                src={product.coverImage || product.imageUrl}
                alt={product.title || product.name}
                className="w-full h-full object-cover"
              />
              {product.isSaremiPick && (
                <div className="absolute top-3 left-3 bg-[#121829] text-[#D49A3D] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow">
                  ★ Saremi Pick
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#8C6428]">
                  {isDigital ? '📚 Saremi Digital Resource' : `🎸 Curated Gear • ${product.brand || 'Gear'}`}
                </span>
                {product.rating && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-[#D49A3D] text-[#D49A3D]" />
                    <span>{product.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121829] leading-tight">
                {product.title || product.name}
              </h2>

              <p className="mt-3 text-sm text-[#5F667B] leading-relaxed">
                {product.shortDescription || product.description}
              </p>

              {/* Format / Badge tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {product.fileFormat && (
                  <span className="px-3 py-1 rounded-full bg-[#121829] text-[#D49A3D] text-xs font-bold flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    {product.fileFormat}
                  </span>
                )}
                {isDigital && (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    Instant Download & Library Access
                  </span>
                )}
                {!isDigital && (
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
                    Available on {retailer}
                  </span>
                )}
              </div>
            </div>

            {/* Price & Primary CTA */}
            <div className="mt-6 pt-5 border-t border-gray-200/80 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif font-bold text-2xl text-[#121829]">
                    {currencySymbol}{displayPrice.toLocaleString()}
                  </span>
                  {originalPrice && originalPrice > displayPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      {currencySymbol}{originalPrice.toLocaleString()}
                    </span>
                  )}
                  {product.discountInfo && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {product.discountInfo}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-500 block">
                  {isDigital ? 'Single payment • Lifetime access' : `Fulfilled by ${retailer}`}
                </span>
              </div>

              {isDigital ? (
                <div className="flex items-center gap-2">
                  {product.previewUrl && (
                    <button
                      onClick={() => setShowPreviewModal(true)}
                      className="px-3.5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-xs font-bold text-[#121829] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-[#8C6428]" />
                      <span>Preview</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onClose();
                      onBuyNow(product);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#121829] hover:bg-[#D49A3D] text-white hover:text-[#121829] text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <span>Buy Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleExternalAffiliateClick(retailer)}
                  className="px-6 py-2.5 rounded-xl bg-[#D49A3D] hover:bg-[#c48d33] text-[#121829] text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span>View on {retailer}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Detailed Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Full Description */}
          {product.fullDescription && (
            <div>
              <h3 className="font-serif text-lg font-bold text-[#121829] mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D49A3D]" />
                About this {isDigital ? 'Resource' : 'Instrument'}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.fullDescription}
              </p>
            </div>
          )}

          {/* DIGITAL PRODUCT: What You'll Learn */}
          {isDigital && product.whatYoullLearn && product.whatYoullLearn.length > 0 && (
            <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#E5E0D8]">
              <h4 className="font-serif text-base font-bold text-[#121829] mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D49A3D]" />
                What You'll Learn & Master
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.whatYoullLearn.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* DIGITAL PRODUCT: Who It's For */}
          {isDigital && product.whoItsFor && product.whoItsFor.length > 0 && (
            <div>
              <h4 className="font-serif text-base font-bold text-[#121829] mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D49A3D]" />
                Who Is It For?
              </h4>
              <div className="flex flex-wrap gap-2">
                {product.whoItsFor.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200"
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AFFILIATE PRODUCT: Key Features */}
          {!isDigital && product.keyFeatures && product.keyFeatures.length > 0 && (
            <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#E5E0D8]">
              <h4 className="font-serif text-base font-bold text-[#121829] mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Key Specifications & Features
              </h4>
              <ul className="space-y-2">
                {product.keyFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D49A3D] shrink-0 mt-2" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AFFILIATE PRODUCT: Why We Recommend It */}
          {!isDigital && product.whyWeRecommendIt && (
            <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200/80">
              <h4 className="font-serif text-base font-bold text-amber-950 mb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#D49A3D]" />
                Why Saremi Academy Recommends It
              </h4>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                {product.whyWeRecommendIt}
              </p>
            </div>
          )}

          {/* AFFILIATE PRODUCT: Suitable For */}
          {!isDigital && product.suitableFor && product.suitableFor.length > 0 && (
            <div>
              <h4 className="font-serif text-base font-bold text-[#121829] mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D49A3D]" />
                Suitable For:
              </h4>
              <div className="flex flex-wrap gap-2">
                {product.suitableFor.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs font-semibold"
                  >
                    • {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AFFILIATE PRODUCT: Available Retailers CTAs */}
          {!isDigital && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-serif text-sm font-bold text-gray-900 mb-3">Available From</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleExternalAffiliateClick('Amazon')}
                  className="px-5 py-2.5 rounded-xl bg-[#D49A3D] text-[#121829] hover:bg-[#c48d33] font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>View on Amazon</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                {product.affiliateUrl?.includes('flipkart') && (
                  <button
                    onClick={() => handleExternalAffiliateClick('Flipkart')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>View on Flipkart</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Security / Trust Footnote */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {isDigital
                  ? 'Secured 256-bit encrypted Razorpay direct checkout'
                  : 'Fulfilled, shipped and handled directly by verified retailer'}
              </span>
            </div>
          </div>
        </div>

        {/* Optional Preview Modal overlay */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80">
            <div className="bg-white rounded-2xl p-6 max-w-xl w-full text-left space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h4 className="font-serif font-bold text-lg text-gray-900">
                  Preview: {product.title || product.name}
                </h4>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-[#FAF8F5] p-6 rounded-xl border border-gray-200 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-[#D49A3D] mx-auto" />
                <p className="text-sm font-semibold text-gray-800">
                  Sample Excerpt from {product.fileFormat || 'Ebook'}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  "Chapter 1: The Foundation of Riyaaz — Breath, Posture, and Microtonal Swara Resonance..."
                </p>
                <div className="text-xs text-emerald-700 font-bold bg-emerald-50 py-1 px-3 rounded-full inline-block">
                  Complete 68-page PDF & audio stems unlocked immediately after verified purchase
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    onClose();
                    onBuyNow(product);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#121829] hover:bg-[#D49A3D] hover:text-[#121829]"
                >
                  Buy Now (${displayPrice} / ₹{displayPrice})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
