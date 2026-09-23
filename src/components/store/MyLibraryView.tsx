import React, { useState, useEffect } from 'react';
import {
  Library,
  Download,
  BookOpen,
  ArrowLeft,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Search
} from 'lucide-react';
import { PurchasedProduct } from '@/src/types';
import { useAuth } from '@/src/context/AuthContext';
import { getUserPurchasedProducts } from '@/src/lib/firestoreService';

interface MyLibraryViewProps {
  onBackToStore: () => void;
}

export const MyLibraryView: React.FC<MyLibraryViewProps> = ({ onBackToStore }) => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PurchasedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const items = getUserPurchasedProducts(user?.email || undefined);
    setPurchases(items);
  }, [user]);

  const filteredPurchases = purchases.filter((p) =>
    p.productTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (purchase: PurchasedProduct) => {
    if (purchase.downloadUrl) {
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
    <div className="min-h-screen bg-[#FAF8F5] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Back navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200/80 mb-8">
          <div>
            <button
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#121829] transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Saremi Store</span>
            </button>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#121829] flex items-center gap-3">
              <Library className="w-8 h-8 text-[#D49A3D]" />
              <span>My Digital Library</span>
            </h1>
            <p className="text-sm text-[#5F667B] mt-1">
              Your purchased masterclasses, study guides, and sheet music with lifetime access.
            </p>
          </div>

          {/* Search within library */}
          {purchases.length > 0 && (
            <div className="w-full sm:w-64 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#D49A3D]"
              />
            </div>
          )}
        </div>

        {/* Content */}
        {purchases.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-[#D49A3D] flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#121829]">
              Your Library is Empty
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
              You have not purchased any digital resources yet. Explore our curated vocal guides, tabla rhythm codices, and music theory ebooks.
            </p>
            <div className="mt-6">
              <button
                onClick={onBackToStore}
                className="px-6 py-3 rounded-xl bg-[#121829] hover:bg-[#D49A3D] text-white hover:text-[#121829] font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                Browse Digital Products in Store
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPurchases.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-gray-100 mb-4 border border-gray-100">
                    <img
                      src={item.coverImage}
                      alt={item.productTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-[#121829] text-[#D49A3D] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      {item.fileFormat}
                    </div>
                  </div>

                  <h3 className="font-serif text-base font-bold text-[#121829] line-clamp-2">
                    {item.productTitle}
                  </h3>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-100 pt-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(item.purchaseDate).toLocaleDateString()}
                    </span>
                    <span className="font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(item)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#121829] hover:bg-[#D49A3D] text-white hover:text-[#121829] font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                  {item.downloadUrl && (
                    <a
                      href={item.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors"
                      title="Read Online"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
