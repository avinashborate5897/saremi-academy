import React from 'react';
import { useRouter } from '../../router/RouterContext';
import { SEOHead } from '../SEOHead';
import { FreeDemoBookingForm } from '../forms/FreeDemoBookingForm';
import { ShieldCheck, Sparkles, MessageSquare, Headphones, Award, Star } from 'lucide-react';

export const FreeTrialFunnel: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 sm:py-16 px-4 sm:px-6 text-left">
      <SEOHead
        title="Book Your Free Demo Class | Saremi Academy"
        description="Experience a live 1:1 online music class with Saremi Academy before you decide. No commitment, personalized guidance in Singing, Guitar, Keyboard, Tabla, Violin, and Flute."
        canonicalPath="/free-trial"
      />

      <div className="max-w-xl mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-[#EAE5DB]">
          <FreeDemoBookingForm />
        </div>

        {/* Supporting Trust Badges */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <div className="p-3.5 bg-white/70 rounded-2xl border border-[#EAE5DB]/70 space-y-1">
            <span className="text-xl sm:text-2xl block">🎵</span>
            <strong className="text-xs font-bold text-[#0F0F0F] block">Live 1:1 Guru</strong>
            <span className="text-[10px] text-gray-500 font-mono">Personalized guidance</span>
          </div>

          <div className="p-3.5 bg-white/70 rounded-2xl border border-[#EAE5DB]/70 space-y-1">
            <span className="text-xl sm:text-2xl block">✨</span>
            <strong className="text-xs font-bold text-[#0F0F0F] block">100% Free</strong>
            <span className="text-[10px] text-gray-500 font-mono">Zero commitments</span>
          </div>

          <div className="p-3.5 bg-white/70 rounded-2xl border border-[#EAE5DB]/70 space-y-1">
            <span className="text-xl sm:text-2xl block">💬</span>
            <strong className="text-xs font-bold text-[#0F0F0F] block">WhatsApp Setup</strong>
            <span className="text-[10px] text-gray-500 font-mono">Flexible timing</span>
          </div>
        </div>
      </div>
    </div>
  );
};
