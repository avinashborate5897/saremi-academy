import React from 'react';
import { Download, Star, ArrowRight, BookOpen } from 'lucide-react';
import { Product } from '@/src/types';

interface DigitalProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const DigitalProductCard: React.FC<DigitalProductCardProps> = ({
  product,
  onViewDetails,
  onBuyNow
}) => {
  const displayPrice = product.salePrice || product.price || 199;
  const originalPrice = product.originalPrice;
  const currencySymbol = product.currency === 'USD' ? '$' : '₹';

  return (
    <div
      id={`digital-product-${product.id}`}
      className="bg-white rounded-xl border border-gray-200/80 hover:border-[#D49A3D]/70 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group text-left"
    >
      {/* Cover Visual */}
      <div
        className="relative aspect-4/3 overflow-hidden bg-[#121829]/5 cursor-pointer"
        onClick={() => onViewDetails(product)}
      >
        <img
          src={product.coverImage || product.imageUrl}
          alt={product.title || product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <span className="inline-flex items-center gap-0.5 bg-[#121829]/90 text-[#D49A3D] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded shadow-xs backdrop-blur-xs">
            <BookOpen className="w-2.5 h-2.5" />
            <span>Ebook</span>
          </span>
          {product.badge && (
            <span className="bg-[#D49A3D] text-[#121829] text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-xs">
              {product.badge}
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2">
          <span className="bg-emerald-700/90 text-white text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1 backdrop-blur-xs">
            <Download className="w-2.5 h-2.5" />
            <span>PDF</span>
          </span>
        </div>

        {/* Rating preview */}
        {product.rating && (
          <div className="absolute bottom-1.5 left-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] font-semibold text-white">
            <Star className="w-2.5 h-2.5 fill-[#D49A3D] text-[#D49A3D]" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C6428] mb-0.5 line-clamp-1">
            {product.category === 'ebooks' ? '📚 Music Guide' : '🎧 Digital Resource'}
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

          {product.fileFormat && (
            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-gray-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D49A3D]" />
              <span className="truncate">{product.fileFormat}</span>
            </div>
          )}
        </div>

        {/* Price & Action */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1.5">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif font-bold text-sm sm:text-base text-[#121829]">
                {currencySymbol}{displayPrice}
              </span>
              {originalPrice && originalPrice > displayPrice && (
                <span className="text-[10px] text-gray-400 line-through">
                  {currencySymbol}{originalPrice}
                </span>
              )}
            </div>
            <span className="text-[9px] text-emerald-700 font-medium block">Instant Access</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onBuyNow(product)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold text-white bg-[#121829] hover:bg-[#D49A3D] hover:text-[#121829] shadow-xs transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Buy</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
