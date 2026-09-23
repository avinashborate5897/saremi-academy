import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  ExternalLink,
  Star,
  Download
} from 'lucide-react';
import { Product, PurchasedProduct } from '@/src/types';
import { subscribeToProducts, trackAffiliateClick } from '@/src/lib/firestoreService';
import { useRouter } from '@/src/router/RouterContext';
import { DigitalCheckoutModal } from '../store/DigitalCheckoutModal';
import { ProductDetailModal } from '../store/ProductDetailModal';
import { PurchaseSuccessModal } from '../store/PurchaseSuccessModal';

export const StoreSection: React.FC = () => {
  const { navigate } = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<Product | null>(null);
  const [purchasedProductResult, setPurchasedProductResult] = useState<PurchasedProduct | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((items) => {
      setProducts(items);
    });
    return () => unsubscribe();
  }, []);

  // Show top ebooks first, then top gear picks
  const digitalPicks = products.filter(
    (p) => p.type === 'digital' || p.productType === 'DIGITAL_PRODUCT'
  );
  const gearPicks = products.filter(
    (p) => p.type === 'affiliate' || p.productType === 'AFFILIATE_PRODUCT'
  );

  const displayProducts = [
    ...digitalPicks.slice(0, 2),
    ...gearPicks.slice(0, 1)
  ].slice(0, 3);

  const handleAffiliateClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (product.affiliateUrl) {
      trackAffiliateClick(product.id, product.retailer || 'Amazon', product.category);
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section id="saremi-store-preview" className="py-12 sm:py-16 bg-[#FAF8F5] border-t border-gray-200/80 text-left">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-gray-200">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#121829] text-[#D49A3D] text-[10px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Saremi Store</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121829] tracking-tight">
              Learn. Practice. Create.
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#5F667B] max-w-lg font-sans">
              Music ebooks, digital resources and carefully selected gear for your musical journey.
            </p>
          </div>

          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => navigate('/shop')}
              className="px-4 py-2 rounded-xl bg-[#121829] hover:bg-[#D49A3D] text-white hover:text-[#121829] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Explore Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3 Compact Products Grid (2-col mobile, 3-col desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {displayProducts.map((product) => {
            const isDigital = product.type === 'digital' || product.productType === 'DIGITAL_PRODUCT';
            const displayPrice = product.salePrice || product.displayPrice || product.price || 199;
            const originalPrice = product.originalPrice;
            const currencySymbol = product.currency === 'USD' ? '$' : '₹';
            const retailer = product.retailer || 'Amazon';

            return (
              <div
                key={product.id}
                id={`home-product-card-${product.id}`}
                className="bg-white rounded-xl border border-gray-200/80 hover:border-[#D49A3D]/70 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group text-left"
              >
                {/* Visual */}
                <div
                  className="relative aspect-4/3 overflow-hidden bg-[#FAF8F5] cursor-pointer flex items-center justify-center p-3 border-b border-gray-100"
                  onClick={() => setSelectedProductForDetail(product)}
                >
                  <img
                    src={product.coverImage || product.imageUrl}
                    alt={product.title || product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {isDigital ? (
                      <span className="inline-flex items-center gap-0.5 bg-[#121829] text-[#D49A3D] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
                        <BookOpen className="w-2.5 h-2.5" />
                        <span>Ebook</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 bg-[#121829] text-[#D49A3D] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
                        <Award className="w-2.5 h-2.5 text-[#D49A3D]" />
                        <span>Pick</span>
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2">
                    {isDigital ? (
                      <span className="bg-emerald-700 text-white text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                        <Download className="w-2.5 h-2.5" />
                        <span>PDF</span>
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        {retailer}
                      </span>
                    )}
                  </div>

                  {product.rating && (
                    <div className="absolute bottom-1.5 left-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] font-semibold text-gray-800 border border-gray-100 shadow-xs">
                      <Star className="w-2.5 h-2.5 fill-[#D49A3D] text-[#D49A3D]" />
                      <span>{product.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C6428] mb-0.5">
                      {isDigital ? '📚 Music Guide' : `🎸 ${product.brand || 'Gear'}`}
                    </div>

                    <h3
                      onClick={() => setSelectedProductForDetail(product)}
                      className="font-serif text-xs sm:text-sm font-bold text-[#121829] group-hover:text-[#8C6428] transition-colors line-clamp-2 cursor-pointer leading-snug"
                    >
                      {product.title || product.name}
                    </h3>

                    <p className="mt-1 text-[11px] text-[#5F667B] line-clamp-2 leading-relaxed">
                      {product.shortDescription || product.description}
                    </p>
                  </div>

                  {/* Price & Primary CTA */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div>
                      {displayPrice ? (
                        <div className="flex items-baseline gap-1">
                          <span className="font-serif font-bold text-sm sm:text-base text-[#121829]">
                            {currencySymbol}{displayPrice.toLocaleString()}
                          </span>
                          {originalPrice && originalPrice > displayPrice && (
                            <span className="text-[10px] text-gray-400 line-through">
                              {currencySymbol}{originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-500 font-medium">Check Price</span>
                      )}
                      <span className="text-[9px] text-gray-400 block">
                        {isDigital ? 'Instant Access' : `Via ${retailer}`}
                      </span>
                    </div>

                    {isDigital ? (
                      <button
                        onClick={() => setSelectedProductForCheckout(product)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#121829] hover:bg-[#D49A3D] hover:text-[#121829] shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Buy</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleAffiliateClick(e, product)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#121829] bg-[#D49A3D] hover:bg-[#c48d33] transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>{retailer}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProductForDetail && (
        <ProductDetailModal
          product={selectedProductForDetail}
          onClose={() => setSelectedProductForDetail(null)}
          onBuyNow={(p) => {
            setSelectedProductForDetail(null);
            setSelectedProductForCheckout(p);
          }}
        />
      )}

      {/* Digital Direct Checkout Modal */}
      {selectedProductForCheckout && (
        <DigitalCheckoutModal
          product={selectedProductForCheckout}
          onClose={() => setSelectedProductForCheckout(null)}
          onSuccess={(purchaseRecord) => {
            setSelectedProductForCheckout(null);
            setPurchasedProductResult(purchaseRecord);
          }}
        />
      )}

      {/* Purchase Success Modal */}
      {purchasedProductResult && (
        <PurchaseSuccessModal
          purchase={purchasedProductResult}
          onClose={() => setPurchasedProductResult(null)}
          onGoToLibrary={() => {
            setPurchasedProductResult(null);
            navigate('/shop');
          }}
        />
      )}
    </section>
  );
};
