import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ShieldCheck, Sparkles, Star, Award, Zap } from 'lucide-react';
import { LearningMode, SaremiPackage } from '../../data/pricingData';
import { COURSE_CATALOG, COURSE_LIST, formatINR } from '../../lib/courseCatalog';
import { subscribeToPackages, initializePackagesInFirestore } from '../../lib/pricingService';
import { useRouter } from '../../router/RouterContext';
import { SEOHead } from '../SEOHead';
import { SaremiButton, SaremiBadge, SaremiCard } from '../common/SaremiUI';

interface PricingViewProps {
  onOpenBooking: () => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ onOpenBooking }) => {
  const [activeMode, setActiveMode] = useState<LearningMode>('one_to_one');
  const [sessions, setSessions] = useState<4 | 8>(4);
  const [packages, setPackages] = useState<SaremiPackage[]>([]);
  const { navigate } = useRouter();

  useEffect(() => {
    initializePackagesInFirestore();
    const unsub = subscribeToPackages(setPackages);
    return () => unsub();
  }, []);

  const handleEnroll = (pkg: SaremiPackage) => {
    navigate(`/checkout?mode=${pkg.learningMode}&sessions=${pkg.sessionsPerMonth}&duration=${pkg.durationMonths}`);
  };

  const currentPackages = packages
    .filter((p) => p.learningMode === activeMode && p.sessionsPerMonth === sessions && p.active)
    .sort((a, b) => a.durationMonths - b.durationMonths);

  useEffect(() => {
    if (activeMode === 'group' && sessions === 4) {
      setSessions(8);
    }
  }, [activeMode, sessions]);

  return (
    <div className="bg-saremi-bg min-h-screen pt-12 pb-24 text-left">
      <SEOHead
        title="Tuition Packages & Pricing | Saremi Academy"
        description="Official tuition packages for vocals, guitar, keyboard, and tabla with 1:1 live maestro sessions."
        canonicalPath="/pricing"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-purple-100 shadow-sm">
            <Sparkles className="w-4 h-4 text-saremi-secondary" />
            <span className="text-xs font-bold text-saremi-primary uppercase tracking-wider font-display">
              Official Tuition & Enrollment
            </span>
          </div>
          
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
            Choose Your Music Journey
          </h1>
          <p className="text-slate-600 font-medium text-base sm:text-lg">
            Transparent pricing. Certified academy mentors. Transformative live lessons.
          </p>
        </div>

        {/* Category Switcher */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 bg-white p-2 rounded-[22px] shadow-saremi-card border border-slate-100">
            <button
              onClick={() => setActiveMode('one_to_one')}
              className={`px-5 py-3 rounded-[16px] font-display font-bold text-sm transition-all flex flex-col items-center min-h-[44px] cursor-pointer ${
                activeMode === 'one_to_one'
                  ? 'bg-saremi-primary text-white shadow-saremi-purple'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex gap-1 mb-1 text-base">🎤 🎸 🎹 🪘</div>
              Standard 1:1 Mentorship
            </button>
            <button
              onClick={() => setActiveMode('group')}
              className={`px-5 py-3 rounded-[16px] font-display font-bold text-sm transition-all flex flex-col items-center min-h-[44px] cursor-pointer ${
                activeMode === 'group'
                  ? 'bg-saremi-green text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex gap-1 mb-1 text-base">🎤</div>
              Group Batches (Hindustani Vocals)
            </button>
            <button
              onClick={() => setActiveMode('premium_one_to_one')}
              className={`px-5 py-3 rounded-[16px] font-display font-bold text-sm transition-all flex flex-col items-center min-h-[44px] cursor-pointer ${
                activeMode === 'premium_one_to_one'
                  ? 'bg-slate-900 text-saremi-yellow shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex gap-1 mb-1 text-base">🎻 🪈</div>
              Premium Instruments (Violin/Flute)
            </button>
          </div>
        </div>

        {/* Sessions Toggle */}
        {activeMode !== 'group' && (
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white p-1.5 rounded-full border border-purple-100 shadow-sm">
              {[4, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => setSessions(s as 4 | 8)}
                  className={`px-6 py-2 rounded-full text-xs font-bold font-display transition-all min-h-[40px] cursor-pointer ${
                    sessions === s
                      ? 'bg-saremi-primary text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s} Sessions / Month
                </button>
              ))}
            </div>
          </div>
        )}
        {activeMode === 'group' && (
          <div className="text-center mb-12">
            <span className="inline-block bg-white text-slate-700 border border-slate-200 px-5 py-2 rounded-full text-xs font-bold font-display shadow-xs">
              Fixed Schedule: 8 Sessions / Month
            </span>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {currentPackages.map((pkg) => {
            const isBestValue = pkg.durationMonths === 3 || pkg.bestValue;
            const isTwoMonth = pkg.durationMonths === 2;

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative flex flex-col ${isBestValue ? 'md:-mt-4 md:mb-4 z-10' : ''}`}
              >
                <div
                  className={`h-full flex flex-col justify-between p-7 rounded-[26px] transition-all duration-300 ${
                    isBestValue
                      ? 'bg-gradient-to-b from-white to-purple-50/50 border-2 border-saremi-primary shadow-saremi-purple md:scale-105'
                      : isTwoMonth
                      ? 'bg-white border-2 border-orange-200 shadow-saremi-card'
                      : 'bg-white border border-slate-200 shadow-saremi-card'
                  }`}
                >
                  {/* Top Floating Badges */}
                  {isBestValue && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-gradient-to-r from-saremi-primary to-purple-800 text-white px-4 py-1 rounded-full text-xs font-bold font-display shadow-saremi-purple whitespace-nowrap">
                      <span>👑 BEST VALUE</span>
                      <span className="bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full text-[10px] font-black">
                        🔥 SAVE 15%
                      </span>
                    </div>
                  )}
                  {isTwoMonth && !isBestValue && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 px-3.5 py-1 rounded-full text-xs font-black font-display shadow-sm whitespace-nowrap">
                      🔥 SAVE 10%
                    </div>
                  )}

                  <div>
                    {/* Duration Title */}
                    <div className="text-center pt-2 mb-6">
                      <h3 className={`font-serif text-2xl font-bold mb-2 ${isBestValue ? 'text-saremi-primary' : 'text-slate-900'}`}>
                        {pkg.durationMonths} Month{pkg.durationMonths > 1 ? 's' : ''}
                      </h3>
                      
                      <div className="flex items-baseline justify-center gap-1 my-2">
                        <span className="font-serif text-4xl font-extrabold text-slate-900">
                          ₹{pkg.monthlyDisplayPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-slate-500 font-bold text-xs">/month</span>
                      </div>

                      {pkg.durationMonths > 1 && (
                        <p className="text-xs font-bold text-saremi-secondary">
                          Total: ₹{pkg.totalPrice.toLocaleString('en-IN')} billed once
                        </p>
                      )}
                    </div>

                    {/* Features List */}
                    <div className="space-y-3.5 py-6 border-t border-b border-slate-100 mb-6 text-xs">
                      <div className="flex items-start gap-2.5 text-slate-700 font-medium">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isBestValue ? 'text-saremi-primary' : 'text-saremi-green'}`} />
                        <span><strong>{pkg.sessionsPerMonth * pkg.durationMonths} Total Live Sessions</strong></span>
                      </div>
                      <div className="flex items-start gap-2.5 text-slate-700 font-medium">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isBestValue ? 'text-saremi-primary' : 'text-saremi-green'}`} />
                        <span>{pkg.learningMode === 'group' ? 'Interactive Group Environment' : '1:1 Personalized Attention'}</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-slate-700 font-medium">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isBestValue ? 'text-saremi-primary' : 'text-saremi-green'}`} />
                        <span>Full Practice Studio & Tanpura Access</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-slate-700 font-medium">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isBestValue ? 'text-saremi-primary' : 'text-saremi-green'}`} />
                        <span>24-Hour Video Homework Review</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2.5">
                    <SaremiButton
                      variant={isBestValue ? 'primary' : 'outline'}
                      size="lg"
                      fullWidth
                      onClick={() => handleEnroll(pkg)}
                    >
                      Select Plan
                    </SaremiButton>
                    
                    {isBestValue && (
                      <SaremiButton
                        variant="soft-pink"
                        size="sm"
                        fullWidth
                        onClick={onOpenBooking}
                      >
                        Book Free Trial First
                      </SaremiButton>
                    )}
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div className="mt-16 p-8 rounded-[28px] bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto shadow-xl">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <strong className="block text-white font-serif text-lg font-bold mb-1">
                100% Satisfaction Guarantee
              </strong>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                If you aren't completely thrilled after your first official lesson, we will rematch your guru or refund remaining sessions immediately.
              </p>
            </div>
          </div>
          <SaremiButton
            variant="yellow"
            size="md"
            onClick={onOpenBooking}
            className="shrink-0 w-full sm:w-auto text-slate-900"
          >
            Book Free Trial
          </SaremiButton>
        </div>

      </div>
    </div>
  );
};
