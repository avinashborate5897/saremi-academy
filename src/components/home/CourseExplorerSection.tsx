import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, CheckCircle2, Crown, Flame, ShieldCheck, Clock, User, Users } from 'lucide-react';
import { SaremiButton, SaremiBadge } from '../common/SaremiUI';
import { 
  SingingIllustration, 
  GuitarIllustration, 
  KeyboardIllustration, 
  TablaIllustration, 
  ViolinIllustration, 
  FluteIllustration 
} from '../common/MusicIllustrations';
import { COURSE_CATALOG, getCourseBySlug, formatINR } from '../../lib/courseCatalog';
import { useRouter } from '../../router/RouterContext';

interface Props {
  onExploreCourses: () => void;
  onSelectInstrument?: (instrumentId: string) => void;
}

interface InstrumentMeta {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  desc: string;
  cta: string;
  category: 'singing' | 'guitar' | 'keyboard' | 'tabla' | 'violin' | 'flute';
  bgClass: string;
  buttonVariant: 'primary' | 'secondary' | 'blue' | 'yellow' | 'green';
  illustration: React.FC<{ className?: string }>;
  level: string;
  mode: string;
  startingPrice: string;
  priceNote: string;
  pricingHighlights: {
    label: string;
    oneMonth: string;
    threeMonth: string;
    isBest?: boolean;
  }[];
}

const instruments: InstrumentMeta[] = [
  {
    id: 'singing',
    slug: 'hindustani-classical-vocals',
    title: 'Singing & Vocals',
    subtitle: 'Hindustani Classical, Carnatic & Semi-Classical',
    desc: 'Discover your authentic pitch, master voice modulation, swaras, and breath control with live gharana maestros.',
    cta: 'Explore & Enroll Singing',
    category: 'singing',
    bgClass: 'bg-saremi-soft-pink/40 border-pink-200/80',
    buttonVariant: 'secondary',
    illustration: SingingIllustration,
    level: 'Beginner to Advanced',
    mode: '1:1 Live & Group Batches',
    startingPrice: '₹1,899',
    priceNote: 'per month in Group (₹1,614/mo on 3M term)',
    pricingHighlights: [
      {
        label: 'Group Batch (8 Classes/Mo)',
        oneMonth: '₹1,899/mo',
        threeMonth: '₹4,842 total (₹1,614/mo • Save 15%)'
      },
      {
        label: '1:1 Live (8 Classes/Mo • 2x/wk)',
        oneMonth: '₹4,499/mo',
        threeMonth: '₹11,997 total (₹3,999/mo • 👑 Best Value)',
        isBest: true
      },
      {
        label: '1:1 Live (4 Classes/Mo • 1x/wk)',
        oneMonth: '₹2,499/mo',
        threeMonth: '₹5,997 total (₹1,999/mo • Save 15%)'
      }
    ]
  },
  {
    id: 'guitar',
    slug: 'acoustic-classical-guitar',
    title: 'Acoustic & Classical Guitar',
    subtitle: 'Chords, Strumming Patterns & Fingerstyle Polyphony',
    desc: 'Learn chord progressions, lead scales, rhythmic strumming, and fingerstyle solo playing from day one.',
    cta: 'Explore & Enroll Guitar',
    category: 'guitar',
    bgClass: 'bg-orange-50/70 border-orange-200/80',
    buttonVariant: 'primary',
    illustration: GuitarIllustration,
    level: 'All Skill Levels',
    mode: '1:1 Live Mentorship',
    startingPrice: '₹1,999',
    priceNote: 'per month on 3M term (₹2,499 1-month)',
    pricingHighlights: [
      {
        label: '1:1 Live (8 Classes/Mo • 2x/wk)',
        oneMonth: '₹4,499/mo',
        threeMonth: '₹11,997 total (₹3,999/mo • 👑 Best Value)',
        isBest: true
      },
      {
        label: '1:1 Live (4 Classes/Mo • 1x/wk)',
        oneMonth: '₹2,499/mo',
        threeMonth: '₹5,997 total (₹1,999/mo • Save 15%)'
      }
    ]
  },
  {
    id: 'keyboard',
    slug: 'western-classical-piano',
    title: 'Keyboard & Piano',
    subtitle: 'Western Classical & Contemporary Piano',
    desc: 'Master dual-hand coordination, sight reading, chord harmony, and classical sonatas with structured lessons.',
    cta: 'Explore & Enroll Piano',
    category: 'keyboard',
    bgClass: 'bg-saremi-soft-blue/50 border-cyan-200/80',
    buttonVariant: 'blue',
    illustration: KeyboardIllustration,
    level: 'Trinity & ABRSM Graded',
    mode: '1:1 Live Mentorship',
    startingPrice: '₹1,999',
    priceNote: 'per month on 3M term (₹2,499 1-month)',
    pricingHighlights: [
      {
        label: '1:1 Live (8 Classes/Mo • 2x/wk)',
        oneMonth: '₹4,499/mo',
        threeMonth: '₹11,997 total (₹3,999/mo • 👑 Best Value)',
        isBest: true
      },
      {
        label: '1:1 Live (4 Classes/Mo • 1x/wk)',
        oneMonth: '₹2,499/mo',
        threeMonth: '₹5,997 total (₹1,999/mo • Save 15%)'
      }
    ]
  },
  {
    id: 'tabla',
    slug: 'classical-tabla-mastery',
    title: 'Tabla & Indian Rhythm',
    subtitle: 'Taals, Bols, Kaydas & Accompaniment Science',
    desc: 'Master rhythmic cycles, bols, clarity of stroke, and speed accompaniment with hereditary masters.',
    cta: 'Explore & Enroll Tabla',
    category: 'tabla',
    bgClass: 'bg-saremi-soft-yellow/50 border-yellow-200/80',
    buttonVariant: 'yellow',
    illustration: TablaIllustration,
    level: 'Classical Certification',
    mode: '1:1 Live Mentorship',
    startingPrice: '₹1,999',
    priceNote: 'per month on 3M term (₹2,499 1-month)',
    pricingHighlights: [
      {
        label: '1:1 Live (8 Classes/Mo • 2x/wk)',
        oneMonth: '₹4,499/mo',
        threeMonth: '₹11,997 total (₹3,999/mo • 👑 Best Value)',
        isBest: true
      },
      {
        label: '1:1 Live (4 Classes/Mo • 1x/wk)',
        oneMonth: '₹2,499/mo',
        threeMonth: '₹5,997 total (₹1,999/mo • Save 15%)'
      }
    ]
  },
  {
    id: 'violin',
    slug: 'violin-strings-mastery',
    title: 'Carnatic & Western Violin',
    subtitle: 'Bowing Technique, Gamakas & Pitch Intonation',
    desc: 'Develop immaculate posture, smooth bow control, microtonal nuances, and emotive melodic expression with senior string virtuosos.',
    cta: 'Explore & Enroll Violin',
    category: 'violin',
    bgClass: 'bg-saremi-soft-purple/50 border-purple-200/80',
    buttonVariant: 'primary',
    illustration: ViolinIllustration,
    level: 'Foundation to Diploma',
    mode: 'Premium 1:1 Mentorship',
    startingPrice: '₹2,299',
    priceNote: 'per month on 3M term (₹2,699 1-month)',
    pricingHighlights: [
      {
        label: 'Premium 1:1 (8 Classes/Mo • 2x/wk)',
        oneMonth: '₹4,999/mo',
        threeMonth: '₹12,747 total (₹4,249/mo • 👑 Best Value)',
        isBest: true
      },
      {
        label: 'Premium 1:1 (4 Classes/Mo • 1x/wk)',
        oneMonth: '₹2,699/mo',
        threeMonth: '₹6,897 total (₹2,299/mo • Save 15%)'
      }
    ]
  },
  {
    id: 'flute',
    slug: 'bansuri-flute-mastery',
    title: 'Bansuri & Western Flute',
    subtitle: 'Blow Technique, Raga Improvisation & Phrasing',
    desc: 'Learn gentle breath control, pure tone generation, intricate meend glides, and soothing classical melodies under Maihar gharana guidance.',
    cta: 'Explore & Enroll Flute',
    category: 'flute',
    bgClass: 'bg-emerald-50/70 border-emerald-200/80',
    buttonVariant: 'green',
    illustration: FluteIllustration,
    level: 'All Age Groups',
    mode: 'Premium 1:1 Mentorship',
    startingPrice: '₹2,299',
    priceNote: 'per month on 3M term (₹2,699 1-month)',
    pricingHighlights: [
      {
        label: 'Premium 1:1 (8 Classes/Mo • 2x/wk)',
        oneMonth: '₹4,999/mo',
        threeMonth: '₹12,747 total (₹4,249/mo • 👑 Best Value)',
        isBest: true
      },
      {
        label: 'Premium 1:1 (4 Classes/Mo • 1x/wk)',
        oneMonth: '₹2,699/mo',
        threeMonth: '₹6,897 total (₹2,299/mo • Save 15%)'
      }
    ]
  },
];

export const CourseExplorerSection: React.FC<Props> = ({ onExploreCourses, onSelectInstrument }) => {
  const { navigate } = useRouter();
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  const handleCardClick = (inst: InstrumentMeta) => {
    if (onSelectInstrument) {
      onSelectInstrument(inst.id);
    } else {
      navigate(`/enroll/${inst.slug}`);
    }
  };

  return (
    <section className="py-20 bg-saremi-bg overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-saremi-soft-purple/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-saremi-soft-pink/50 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-purple-100 shadow-sm mb-3">
              <Sparkles className="w-3.5 h-3.5 text-saremi-secondary" />
              <span className="text-xs font-extrabold text-saremi-primary uppercase tracking-wider font-display">
                Tailored 1:1 Curriculum & Authoritative Tuition
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              What will you play?
            </h2>
            <p className="text-slate-600 font-medium text-base sm:text-lg mt-2">
              Choose your instrument and learn directly with top conservatory teachers through tailored live 1:1 sessions with verified, transparent tuition.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowMatrixModal(!showMatrixModal)}
              className="px-4 py-2.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-xs font-bold text-saremi-primary shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-500" />
              <span>{showMatrixModal ? 'Hide Full Pricing Table' : 'View Full Pricing Table'}</span>
            </button>
            <SaremiButton 
              variant="outline" 
              size="md" 
              onClick={onExploreCourses}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              View All Courses
            </SaremiButton>
          </div>
        </div>

        {/* Optional Expandable Unified Tuition Overview Table */}
        {showMatrixModal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-12 p-6 sm:p-8 rounded-3xl bg-white border-2 border-purple-100 shadow-xl"
          >
            <div className="text-left mb-6">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-700 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Official Academy Pricing Matrix
              </span>
              <h3 className="font-serif text-2xl font-bold text-slate-900 mt-2">
                Transparent All-Inclusive Tuition
              </h3>
              <p className="text-xs text-slate-500">
                All plans include live interactive sessions, Tanpura/Riyaaz Practice Studio, and graded evaluations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Standard 1:1 (4 Sessions) */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DB] text-left">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-[#8C6428]" />
                  <strong className="text-sm font-bold text-slate-900">Standard 1:1 (4 Sessions/Mo)</strong>
                </div>
                <p className="text-xs text-slate-500 mb-3">1 session per week • Flexible Starter</p>
                <div className="space-y-2 text-xs border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span>1 Month (4 classes):</span>
                    <strong className="text-slate-900">₹2,499</strong>
                  </div>
                  <div className="flex justify-between text-amber-900 bg-amber-50/70 p-1.5 rounded">
                    <span>2 Months (8 classes • Save 10%):</span>
                    <strong className="font-bold">₹4,598 (₹2,299/mo)</strong>
                  </div>
                  <div className="flex justify-between text-amber-950 bg-amber-100/70 p-1.5 rounded font-bold">
                    <span>3 Months (12 classes • Save 15%):</span>
                    <strong className="text-amber-800">₹5,997 (₹1,999/mo)</strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Standard 1:1 (8 Sessions - Recommended) */}
              <div className="p-5 rounded-2xl bg-amber-50/50 border-2 border-[#D49A3D] text-left relative shadow-sm">
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#D49A3D] text-[#121829] font-mono text-[10px] font-extrabold">
                  👑 MOST POPULAR
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <strong className="text-sm font-bold text-slate-900">Standard 1:1 (8 Sessions/Mo)</strong>
                </div>
                <p className="text-xs text-slate-500 mb-3">2 sessions per week • Rapid Mastery</p>
                <div className="space-y-2 text-xs border-t border-amber-200/60 pt-3">
                  <div className="flex justify-between">
                    <span>1 Month (8 classes):</span>
                    <strong className="text-slate-900">₹4,499</strong>
                  </div>
                  <div className="flex justify-between text-amber-900 bg-white/80 p-1.5 rounded border border-amber-200/50">
                    <span>2 Months (16 classes • Save 10%):</span>
                    <strong className="font-bold">₹8,598 (₹4,299/mo)</strong>
                  </div>
                  <div className="flex justify-between text-amber-950 bg-amber-200/80 p-1.5 rounded font-bold">
                    <span>3 Months (24 classes • Save 15%):</span>
                    <strong className="text-amber-900">₹11,997 (₹3,999/mo)</strong>
                  </div>
                </div>
              </div>

              {/* Card 3: Group Batches & Premium 1:1 */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DB] text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <strong className="text-sm font-bold text-slate-900">Group Batches (Vocals)</strong>
                </div>
                <p className="text-xs text-slate-500 mb-3">Max 4 students • 8 classes/mo</p>
                <div className="space-y-2 text-xs border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span>1 Month (8 classes):</span>
                    <strong className="text-slate-900">₹1,899</strong>
                  </div>
                  <div className="flex justify-between text-purple-900 bg-purple-50/70 p-1.5 rounded">
                    <span>2 Months (16 classes • Save 10%):</span>
                    <strong className="font-bold">₹3,418 (₹1,709/mo)</strong>
                  </div>
                  <div className="flex justify-between text-purple-950 bg-purple-100/70 p-1.5 rounded font-bold">
                    <span>3 Months (24 classes • Save 15%):</span>
                    <strong className="text-purple-800">₹4,842 (₹1,614/mo)</strong>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200 text-[11px] text-gray-500">
                  <span className="font-bold text-gray-700">🎻 Premium Violin & Flute:</span> 4s from ₹2,699/mo (₹2,299/mo on 3M), 8s from ₹4,999/mo (₹4,249/mo on 3M).
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 6 Instrument Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {instruments.map((inst, idx) => {
            const Illustration = inst.illustration;
            return (
              <motion.div
                key={inst.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className={`rounded-[28px] p-6 border ${inst.bgClass} bg-white shadow-saremi-card hover:shadow-saremi-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between text-left`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <SaremiBadge category={inst.category}>
                      {inst.level}
                    </SaremiBadge>
                    <span className="text-xs font-bold text-slate-500 bg-white/90 px-2.5 py-1 rounded-full border border-slate-100 shadow-2xs">
                      {inst.mode}
                    </span>
                  </div>

                  {/* Instrument Illustration */}
                  <div className="flex items-center justify-center my-3">
                    <Illustration className="w-36 h-36 transform group-hover:scale-105 transition-transform" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-serif text-2xl font-bold text-slate-900 mb-1">
                    {inst.title}
                  </h3>
                  <p className="text-xs font-bold text-saremi-primary mb-2">
                    {inst.subtitle}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-4">
                    {inst.desc}
                  </p>

                  {/* Authoritative Pricing Box */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DB] mb-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block">Tuition Starts At</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-serif font-extrabold text-[#8C6428]">{inst.startingPrice}</span>
                          <span className="text-[11px] text-gray-500 font-medium">/ month</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                        Save up to 15%
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-gray-200/80">
                      {inst.pricingHighlights.map((ph, pIdx) => (
                        <div
                          key={pIdx}
                          className={`text-[11px] p-1.5 rounded-lg flex items-center justify-between ${
                            ph.isBest
                              ? 'bg-amber-100/70 font-semibold text-amber-950 border border-amber-300/50'
                              : 'bg-white/80 text-gray-700 border border-gray-100'
                          }`}
                        >
                          <span className="truncate pr-1">{ph.label}</span>
                          <span className="font-mono font-bold text-gray-900 shrink-0">{ph.oneMonth}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-2 border-t border-slate-100">
                  <SaremiButton
                    variant={inst.buttonVariant}
                    size="md"
                    fullWidth
                    onClick={() => handleCardClick(inst)}
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    {inst.cta}
                  </SaremiButton>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

