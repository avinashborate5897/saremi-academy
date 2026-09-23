import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Music,
  Headphones,
  Award,
  Sparkles,
  Info,
  Library,
  ChevronRight,
  Clock,
  Mic,
  FileText,
  Calendar,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { Product, PurchasedProduct } from '@/src/types';
import { subscribeToProducts, getUserPurchasedProducts } from '@/src/lib/firestoreService';
import { DigitalProductCard } from './DigitalProductCard';
import { AffiliateProductCard } from './AffiliateProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { DigitalCheckoutModal } from './DigitalCheckoutModal';
import { PurchaseSuccessModal } from './PurchaseSuccessModal';
import { MyLibraryView } from './MyLibraryView';
import { useAuth } from '@/src/context/AuthContext';

// Ebook Categories definition
const EBOOK_CATEGORIES = [
  { id: 'vocal', label: 'Vocal & Singing', icon: '🎤', catKey: 'vocals' },
  { id: 'guitar', label: 'Guitar', icon: '🎸', catKey: 'guitars' },
  { id: 'keyboard', label: 'Keyboard', icon: '🎹', catKey: 'keyboards' },
  { id: 'tabla', label: 'Tabla', icon: '🪘', catKey: 'indian_instruments' },
  { id: 'theory', label: 'Music Theory', icon: '🎼', catKey: 'ebooks' },
  { id: 'songbooks', label: 'Songbooks & Practice', icon: '🎵', catKey: 'practice_packs' }
];

// More Digital Resources Categories definition
const FUTURE_DIGITAL_CATEGORIES = [
  { id: 'practice_tracks', label: 'Practice Tracks', icon: '🎧' },
  { id: 'theory_resources', label: 'Music Theory Resources', icon: '🎼' },
  { id: 'worksheets', label: 'Practice Worksheets', icon: '📝' },
  { id: 'challenges', label: '30-Day Challenges', icon: '📅' },
  { id: 'bundles', label: 'Digital Bundles', icon: '📦' },
  { id: 'planners', label: 'Musician Planners', icon: '✍️' },
  { id: 'songbooks_pack', label: 'Songbooks', icon: '🎵' }
];

// Gear Filter Chips
const GEAR_CATEGORIES = [
  { id: 'all', label: 'All Gear' },
  { id: 'guitars', label: 'Guitars' },
  { id: 'keyboards', label: 'Keyboards' },
  { id: 'indian_instruments', label: 'Tabla & Classical' },
  { id: 'microphones', label: 'Microphones' },
  { id: 'headphones', label: 'Headphones' },
  { id: 'audio_interfaces', label: 'Interfaces' },
  { id: 'accessories', label: 'Accessories' }
];

export const SaremiStoreView: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEbookCategory, setSelectedEbookCategory] = useState<string>('all');
  const [selectedGearCategory, setSelectedGearCategory] = useState<string>('all');
  const [activeFutureCategory, setActiveFutureCategory] = useState<string | null>(null);

  // Modals & Navigation
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<Product | null>(null);
  const [purchasedProductResult, setPurchasedProductResult] = useState<PurchasedProduct | null>(null);
  const [viewingLibrary, setViewingLibrary] = useState(false);
  const [libraryCount, setLibraryCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((items) => {
      setProducts(items);
      setLoading(false);
    });

    const libraryItems = getUserPurchasedProducts(user?.email || undefined);
    setLibraryCount(libraryItems.length);

    return () => unsubscribe();
  }, [user]);

  // Digital Ebooks (type === 'digital')
  const allDigitalProducts = products.filter(
    (p) => p.type === 'digital' || p.productType === 'DIGITAL_PRODUCT'
  );

  // Filtered Ebooks
  const filteredEbooks = allDigitalProducts.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.title || p.name || '').toLowerCase().includes(q);
      const matchDesc = (p.shortDescription || p.description || '').toLowerCase().includes(q);
      const matchCat = (p.category || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }

    if (selectedEbookCategory !== 'all') {
      const catObj = EBOOK_CATEGORIES.find((c) => c.id === selectedEbookCategory);
      if (catObj) {
        const catKey = catObj.catKey.toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        const pTitle = (p.title || p.name || '').toLowerCase();
        const matchKey = pCat.includes(catKey) || pTitle.includes(catObj.label.toLowerCase()) || pTitle.includes(catObj.id);
        if (!matchKey && pCat !== catKey) return false;
      }
    }

    return true;
  });

  // Affiliate Gear Products (type === 'affiliate')
  const allAffiliateProducts = products.filter(
    (p) => p.type === 'affiliate' || p.productType === 'AFFILIATE_PRODUCT'
  );

  // Filtered Gear
  const filteredGear = allAffiliateProducts.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.title || p.name || '').toLowerCase().includes(q);
      const matchDesc = (p.shortDescription || p.description || '').toLowerCase().includes(q);
      const matchBrand = (p.brand || '').toLowerCase().includes(q);
      const matchCat = (p.category || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchBrand && !matchCat) return false;
    }

    if (selectedGearCategory !== 'all') {
      if (p.category !== selectedGearCategory) return false;
    }

    return true;
  });

  if (viewingLibrary) {
    return <MyLibraryView onBackToStore={() => setViewingLibrary(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pt-20 sm:pt-24 pb-16 text-left">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* ========================================================= */}
        {/* 4. COMPACT STORE HEADER                                   */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 mb-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#121829] text-[#D49A3D] text-[10px] font-bold uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Saremi Store</span>
              </div>
              <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-[#121829] tracking-tight">
                Learn. Practice. Create.
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-[#5F667B] max-w-xl font-sans leading-relaxed">
                Music ebooks, digital resources and carefully selected gear for your musical journey.
              </p>
            </div>

            {/* Quick Actions (Library + Search) */}
            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
              <button
                onClick={() => setViewingLibrary(true)}
                className="px-3 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#121829] text-[#121829] hover:text-white border border-gray-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Library className="w-3.5 h-3.5 text-[#D49A3D]" />
                <span>My Library</span>
                {libraryCount > 0 && (
                  <span className="bg-[#D49A3D] text-[#121829] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                    {libraryCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Compact Search Bar */}
          <div className="mt-3.5 pt-3.5 border-t border-gray-100 relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ebooks, guides, guitars, keyboards, microphones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2 bg-[#FAF8F5] rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#D49A3D] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-700 font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <div className="w-7 h-7 border-2 border-[#D49A3D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium">Loading Saremi Store...</p>
          </div>
        ) : (
          <div className="space-y-10">

            {/* ========================================================= */}
            {/* 5. FIRST SECTION — 📚 SAREMI EBOOKS (PRIMARY & FIRST)     */}
            {/* ========================================================= */}
            <section id="saremi-ebooks-section" className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 shadow-xs">
              {/* Section Header with Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-[#121829] flex items-center gap-1.5">
                      <span>📚 Saremi Ebooks</span>
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#D49A3D]/15 text-[#8C6428] text-[10px] sm:text-xs font-bold border border-[#D49A3D]/30">
                      Starting from ₹199
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#5F667B]">
                    Practical music guides designed to help you learn and practice at your own pace.
                  </p>
                </div>

                {/* Reset category filter if selected */}
                {selectedEbookCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedEbookCategory('all')}
                    className="text-xs font-bold text-[#8C6428] hover:text-[#121829] self-start sm:self-auto cursor-pointer"
                  >
                    View All Ebooks
                  </button>
                )}
              </div>

              {/* 6. EBOOK CATEGORIES — 6 COMPACT CATEGORY CARDS */}
              <div className="mb-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {EBOOK_CATEGORIES.map((cat) => {
                    const isSelected = selectedEbookCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedEbookCategory(isSelected ? 'all' : cat.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#121829] text-white border-[#121829] shadow-xs'
                            : 'bg-[#FAF8F5] text-[#121829] border-gray-200/80 hover:border-[#D49A3D]/60 hover:bg-amber-50/40'
                        }`}
                      >
                        <div className="text-base mb-1">{cat.icon}</div>
                        <div>
                          <div className={`text-xs font-bold leading-tight line-clamp-1 ${isSelected ? 'text-white' : 'text-[#121829]'}`}>
                            {cat.label}
                          </div>
                          <div className={`text-[10px] mt-0.5 font-medium ${isSelected ? 'text-[#D49A3D]' : 'text-[#8C6428]'}`}>
                            From ₹199
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7 & 8. EBOOK PRODUCT LISTINGS OR COMING SOON */}
              {filteredEbooks.length > 0 ? (
                <div>
                  <div className="text-[11px] font-bold text-gray-500 mb-3 flex items-center justify-between">
                    <span>
                      {selectedEbookCategory !== 'all'
                        ? `Showing ${EBOOK_CATEGORIES.find((c) => c.id === selectedEbookCategory)?.label || 'Category'} Ebooks`
                        : 'Available Digital Guides'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {filteredEbooks.length} {filteredEbooks.length === 1 ? 'Resource' : 'Resources'}
                    </span>
                  </div>

                  {/* Clean 2-column mobile / 3-column desktop grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredEbooks.map((product) => (
                      <DigitalProductCard
                        key={product.id}
                        product={product}
                        onViewDetails={(p) => setSelectedProductForDetail(p)}
                        onBuyNow={(p) => setSelectedProductForCheckout(p)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* 7. EBOOK CATEGORY COMING SOON UX */
                <div className="bg-[#FAF8F5] rounded-xl border border-gray-200/80 p-6 text-center my-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-[#8C6428] flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                    <BookOpen className="w-4 h-4 text-[#8C6428]" />
                  </div>
                  <h3 className="font-serif text-sm sm:text-base font-bold text-[#121829]">Coming Soon</h3>
                  <p className="text-xs text-[#5F667B] mt-1 max-w-sm mx-auto">
                    We're preparing practical resources for you in this category. Check back shortly.
                  </p>
                  {selectedEbookCategory !== 'all' && (
                    <button
                      onClick={() => setSelectedEbookCategory('all')}
                      className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#121829] text-white hover:bg-[#D49A3D] hover:text-[#121829] transition-colors cursor-pointer"
                    >
                      Browse All Ebooks
                    </button>
                  )}
                </div>
              )}
            </section>


            {/* ========================================================= */}
            {/* 10. SECOND SECTION — 🎸 INSTRUMENTS & MUSIC GEAR (AFFILIATE)*/}
            {/* ========================================================= */}
            <section id="saremi-gear-section" className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#121829] flex items-center gap-1.5">
                    <span>🎸 Instruments & Music Gear</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-[#5F667B]">
                    Discover musical instruments and gear selected for musicians.
                  </p>
                </div>

                <div className="text-[10px] font-bold text-gray-400 self-start sm:self-auto bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                  Affiliate Recommendations
                </div>
              </div>

              {/* Compact Gear Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-4">
                {GEAR_CATEGORIES.map((cat) => {
                  const isSelected = selectedGearCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedGearCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-[#121829] text-white shadow-2xs'
                          : 'bg-[#FAF8F5] text-[#5F667B] hover:text-[#121829] hover:bg-gray-100 border border-gray-200/60'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* 11. AFFILIATE PRODUCT GRID (Compact 2-col on mobile, 4-col desktop) */}
              {filteredGear.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filteredGear.map((product) => (
                    <AffiliateProductCard
                      key={product.id}
                      product={product}
                      onViewDetails={(p) => setSelectedProductForDetail(p)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-[#FAF8F5] rounded-xl border border-gray-200/80 p-6 text-center my-2">
                  <Music className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <h3 className="font-serif text-sm font-bold text-[#121829]">Coming Soon</h3>
                  <p className="text-xs text-[#5F667B] mt-1 max-w-sm mx-auto">
                    Faculty-recommended gear for this category is currently being curated.
                  </p>
                  {selectedGearCategory !== 'all' && (
                    <button
                      onClick={() => setSelectedGearCategory('all')}
                      className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#121829] text-white hover:bg-[#D49A3D] hover:text-[#121829] transition-colors cursor-pointer"
                    >
                      View All Gear
                    </button>
                  )}
                </div>
              )}
            </section>


            {/* ========================================================= */}
            {/* 12. THIRD SECTION — 🎧 MORE DIGITAL RESOURCES             */}
            {/* ========================================================= */}
            <section id="saremi-future-digital-section" className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 shadow-xs">
              <div className="mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#121829] flex items-center gap-1.5">
                    <span>🎧 More Digital Resources</span>
                  </h2>
                  <span className="text-[10px] font-bold text-[#8C6428] bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                    Online Downloads
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#5F667B]">
                  Upcoming practice tracks, masterclass worksheets, and companion audio materials.
                </p>
              </div>

              {/* Compact Digital Resource Categories Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {FUTURE_DIGITAL_CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveFutureCategory(item.label)}
                    className="p-3 rounded-xl bg-[#FAF8F5] border border-gray-200/80 hover:border-[#D49A3D]/70 hover:bg-amber-50/40 text-left transition-all cursor-pointer group flex items-start gap-2.5"
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#121829] group-hover:text-[#8C6428] transition-colors leading-tight line-clamp-1">
                        {item.label}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">Explore</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Coming Soon Notice when future category is clicked */}
              {activeFutureCategory && (
                <div className="mt-4 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#8C6428] shrink-0" />
                    <div>
                      <span className="font-bold">{activeFutureCategory}:</span> Coming Soon. We're preparing practical resources for you.
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveFutureCategory(null)}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 ml-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </section>


            {/* ========================================================= */}
            {/* COMPACT AFFILIATE DISCLOSURE                              */}
            {/* ========================================================= */}
            <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-200/80 text-left flex items-start gap-2.5 shadow-2xs">
              <Info className="w-4 h-4 text-[#8C6428] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-bold text-[#121829] uppercase tracking-wider mb-0.5">
                  Affiliate Disclosure
                </h4>
                <p className="text-[11px] text-[#5F667B] leading-relaxed">
                  Some instrument links on Saremi Store are affiliate links to authorized retailers (e.g. Amazon & Flipkart). If you purchase through these links, Saremi Academy may earn a small referral commission at no additional cost to you. All digital ebooks are fulfilled directly by Saremi Academy with instant PDF delivery.
                </p>
              </div>
            </div>

          </div>
        )}
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
            setLibraryCount((prev) => prev + 1);
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
            setViewingLibrary(true);
          }}
        />
      )}
    </div>
  );
};
