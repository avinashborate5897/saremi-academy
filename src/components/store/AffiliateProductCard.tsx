import React from 'react';
import { ExternalLink, Star, Award } from 'lucide-react';
import { Product } from '@/src/types';
import { trackAffiliateClick } from '@/src/lib/firestoreService';

interface AffiliateProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
}

export const AffiliateProductCard: React.FC<AffiliateProductCardProps> = ({
  product,
  onViewDetails
}) => {
  const displayPrice = product.salePrice || product.displayPrice || product.price;
  const originalPrice = product.originalPrice;
  const currencySymbol = product.currency === 'USD' ? '$' : '₹';
  const retailer = product.retailer || 'Amazon';

  const handleExternalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.affiliateUrl) {
      trackAffiliateClick(product.id, retailer, product.category);
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      id={`affiliate-product-${product.id}`}
      className="bg-white rounded-xl border border-gray-200/80 hover:border-[#D49A3D]/70 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group text-left"
    >
      {/* Product Image */}
      <div
        className="relative aspect-4/3 overflow-hidden bg-white cursor-pointer p-3 flex items-center justify-center border-b border-gray-100"
        onClick={() => onViewDetails(product)}
      >
        <img
          src={product.imageUrl || product.coverImage}
          alt={product.title || product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {product.isSaremiPick ? (
            <span className="inline-flex items-center gap-0.5 bg-[#121829] text-[#D49A3D] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded shadow-xs">
              <Award className="w-2.5 h-2.5 text-[#D49A3D]" />
              <span>Pick</span>
            </span>
          ) : product.badge ? (
            <span className="bg-[#D49A3D] text-[#121829] text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-xs">
              {product.badge}
            </span>
          ) : null}
        </div>

        <div className="absolute top-2 right-2">
          <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
            {retailer}
          </span>
        </div>

        {/* Rating preview */}
        {product.rating && (
          <div className="absolute bottom-1.5 left-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] font-semibold text-gray-800 border border-gray-100 shadow-xs">
            <Star className="w-2.5 h-2.5 fill-[#D49A3D] text-[#D49A3D]" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[10px] text-[#8C6428] font-bold uppercase tracking-wider mb-0.5">
            <span className="truncate">{product.brand || 'Selected Gear'}</span>
          </div>

          <h4
            onClick={() => onViewDetails(product)}
            className="font-serif text-xs sm:text-sm font-bold text-[#121829] group-hover:text-[#8C6428] transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {product.title || product.name}
          </h4>

          <p className="mt-1 text-[11px] text-[#5F667B] line-clamp-2 leading-relaxed hidden sm:block">
            {product.shortDescription || product.description}
          </p>
        </div>

        {/* Price & External CTA */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1.5">
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
              <span className="text-[11px] text-gray-500 font-medium">View Price</span>
            )}
            <span className="text-[9px] text-gray-400 block">{retailer}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleExternalClick}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold text-[#121829] bg-[#D49A3D] hover:bg-[#c48d33] transition-colors shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>{retailer}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
