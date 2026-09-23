import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from '../../router/RouterContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Users,
  User,
  Clock,
  Calendar,
  ShieldCheck,
  Award,
  ChevronRight,
  RotateCcw,
  Star,
  Check,
  Flame,
  Crown,
  HeartHandshake,
  Video
} from 'lucide-react';
import { SEOHead } from '../SEOHead';
import { SaremiButton, SaremiBadge, SaremiCard } from '../common/SaremiUI';
import { Course } from '../../types';
import { SaremiPackage } from '../../data/pricingData';
import { COURSE_CATALOG, COURSE_LIST, getCourseBySlug, formatINR } from '../../lib/courseCatalog';
import { subscribeToPackages, findMatchingPackage, formatPackagePricingOption } from '../../lib/pricingService';

interface CoursesViewProps {
  onOpenBooking: () => void;
  onOpenEnrollment?: (course?: Course, packageId?: string) => void;
  slug?: string;
  hideHeroHeader?: boolean;
}

// Main 6 Courses
export type CourseKey = 'singing' | 'guitar' | 'keyboard' | 'tabla' | 'violin' | 'flute';
export type SingingSubKey = 'kids_singing' | 'hindustani_vocals' | 'western_vocals';
export type LearningFormat = 'one_to_one' | 'group';

interface CourseOption {
  id: CourseKey;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  hasSubcategories?: boolean;
  isPremium?: boolean;
  accentColor: string;
  borderColor: string;
}

const COURSES_LIST: CourseOption[] = [
  {
    id: 'singing',
    name: 'Singing',
    emoji: '🎤',
    tagline: 'Kids, Hindustani & Western Vocals',
    description: '1:1 vocal culture, swara accuracy, pitch stability, and performance expression.',
    hasSubcategories: true,
    accentColor: 'from-purple-500 to-indigo-600',
    borderColor: 'border-purple-200 hover:border-purple-400 bg-purple-50/40'
  },
  {
    id: 'guitar',
    name: 'Guitar',
    emoji: '🎸',
    tagline: 'Acoustic, Classical & Electric',
    description: 'Chords, fingerstyle technique, rhythm patterns, and modern song repertoire.',
    accentColor: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-200 hover:border-amber-400 bg-amber-50/40'
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    emoji: '🎹',
    tagline: 'Piano & Western Keyboard',
    description: 'Keyboard posture, scales, left-right hand independence, and chord progressions.',
    accentColor: 'from-blue-500 to-cyan-600',
    borderColor: 'border-blue-200 hover:border-blue-400 bg-blue-50/40'
  },
  {
    id: 'tabla',
    name: 'Tabla',
    emoji: '🪘',
    tagline: 'Indian Classical Percussion',
    description: 'Taal cycles, bols, kaidas, finger placement, and rhythmic accompaniment.',
    accentColor: 'from-orange-500 to-amber-600',
    borderColor: 'border-orange-200 hover:border-orange-400 bg-orange-50/40'
  },
  {
    id: 'violin',
    name: 'Violin',
    emoji: '🎻',
    tagline: 'Classical & Contemporary Strings',
    description: 'Bowing mechanics, microtonal intonation, gamakas, and classical compositions.',
    isPremium: true,
    accentColor: 'from-rose-500 to-pink-600',
    borderColor: 'border-rose-200 hover:border-rose-400 bg-rose-50/40'
  },
  {
    id: 'flute',
    name: 'Flute',
    emoji: '🪈',
    tagline: 'Indian Bamboo Bansuri',
    description: 'Embouchure blowing, breath control, meend, gamak, and raga alaap mastery.',
    isPremium: true,
    accentColor: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/40'
  }
];

const SINGING_SUB_PROGRAMS = [
  {
    id: 'kids_singing' as SingingSubKey,
    name: 'Kids Singing',
    badge: 'Ages 5–12',
    tagline: 'Playful ear-training, swara nursery songs & confidence building',
    formatNote: '👤 1:1 Individual Classes only',
    allowedFormats: ['one_to_one' as LearningFormat],
    icon: '🎨'
  },
  {
    id: 'hindustani_vocals' as SingingSubKey,
    name: 'Hindustani Vocals',
    badge: 'All Ages • Classical & Semi-Classical',
    tagline: 'Kharaj riyaaz, ragas, bandish, taans, and voice culture',
    formatNote: '👤 1:1 Individual & 👥 Group Classes available',
    allowedFormats: ['one_to_one' as LearningFormat, 'group' as LearningFormat],
    icon: '🪷'
  },
  {
    id: 'western_vocals' as SingingSubKey,
    name: 'Western Vocals',
    badge: 'All Ages • Contemporary & Pop',
    tagline: 'Pitch control, breath dynamics, chest-to-head voice mix & repertoire',
    formatNote: '👤 1:1 Individual Classes only',
    allowedFormats: ['one_to_one' as LearningFormat],
    icon: '🎵'
  }
];

export const CoursesView: React.FC<CoursesViewProps> = ({ onOpenBooking, onOpenEnrollment, slug, hideHeroHeader = false }) => {
  const { navigate } = useRouter();

  // State Management for Flow
  const [selectedCourseId, setSelectedCourseId] = useState<CourseKey>('singing');
  const [selectedSingingSub, setSelectedSingingSub] = useState<SingingSubKey>('hindustani_vocals');
  const [learningFormat, setLearningFormat] = useState<LearningFormat>('one_to_one');
  const [sessionsPerMonth, setSessionsPerMonth] = useState<4 | 8>(4);
  const [selectedDuration, setSelectedDuration] = useState<1 | 2 | 3>(3);
  const [packages, setPackages] = useState<SaremiPackage[]>([]);

  // Subscribe to live Admin packages from Firestore
  useEffect(() => {
    const unsub = subscribeToPackages((livePkgs) => {
      setPackages(livePkgs || []);
    });
    return () => unsub();
  }, []);

  // Sync with URL slug if user navigates with a slug (e.g. /course/guitar)
  useEffect(() => {
    if (slug) {
      const lower = slug.toLowerCase();
      if (lower.includes('guitar')) setSelectedCourseId('guitar');
      else if (lower.includes('keyboard') || lower.includes('piano')) setSelectedCourseId('keyboard');
      else if (lower.includes('tabla')) setSelectedCourseId('tabla');
      else if (lower.includes('violin')) setSelectedCourseId('violin');
      else if (lower.includes('flute') || lower.includes('bansuri')) setSelectedCourseId('flute');
      else if (lower.includes('kids')) {
        setSelectedCourseId('singing');
        setSelectedSingingSub('kids_singing');
      } else if (lower.includes('western')) {
        setSelectedCourseId('singing');
        setSelectedSingingSub('western_vocals');
      } else {
        setSelectedCourseId('singing');
        setSelectedSingingSub('hindustani_vocals');
      }
    }
  }, [slug]);

  const currentCourse = COURSES_LIST.find((c) => c.id === selectedCourseId) || COURSES_LIST[0];

  // Determine if Group class is permitted
  // Requirement 4: Group Classes are available ONLY for Hindustani Vocals.
  const isGroupAllowed = selectedCourseId === 'singing' && selectedSingingSub === 'hindustani_vocals';

  // If currently selected format is group but not allowed for this course/sub, reset to 1:1
  useEffect(() => {
    if (!isGroupAllowed && learningFormat === 'group') {
      setLearningFormat('one_to_one');
    }
  }, [isGroupAllowed, learningFormat]);

  // Requirement 11: Group Classes have ONLY 8 Sessions/Month (No 4 Sessions option).
  useEffect(() => {
    if (learningFormat === 'group') {
      setSessionsPerMonth(8);
    }
  }, [learningFormat]);

  // Pricing Matrix Definition
  const isPremiumCourse = currentCourse.isPremium;

  const getPricingPackages = () => {
    const targetMode = learningFormat === 'group' ? 'group' : isPremiumCourse ? 'premium_one_to_one' : 'one_to_one';
    const durations: (1 | 2 | 3)[] = [1, 2, 3];

    return durations.map((dur) => {
      const match = findMatchingPackage(packages, targetMode, sessionsPerMonth, dur);
      return formatPackagePricingOption(match, dur, sessionsPerMonth);
    });
  };

  const currentPackages = getPricingPackages();
  const activePackage = currentPackages.find((p) => p.duration === selectedDuration) || currentPackages[2];

  const handleEnrollNow = (customDuration?: 1 | 2 | 3) => {
    const dur = customDuration || selectedDuration;
    const courseParam = selectedCourseId;
    const subParam = selectedCourseId === 'singing' ? selectedSingingSub : '';
    const modeParam = learningFormat === 'group' ? 'group' : isPremiumCourse ? 'premium_one_to_one' : 'one_to_one';
    
    // DIRECTLY OPEN THE EXISTING CHECKOUT PAGE (bypassing intermediate modal)
    navigate(`/checkout?course=${courseParam}${subParam ? `&sub=${encodeURIComponent(subParam)}` : ''}&mode=${modeParam}&sessions=${sessionsPerMonth}&duration=${dur}`);
  };

  const getCourseDisplayName = () => {
    if (selectedCourseId === 'singing') {
      const sub = SINGING_SUB_PROGRAMS.find((s) => s.id === selectedSingingSub);
      return sub ? sub.name : 'Singing';
    }
    return currentCourse.name;
  };

  return (
    <div className={hideHeroHeader ? "space-y-10 text-left" : "bg-saremi-bg min-h-screen py-10 sm:py-16 text-left"}>
      {!hideHeroHeader && (
        <SEOHead
          title="Courses & Tuition Fees | Saremi Academy"
          description="Choose your live 1:1 music course in Singing, Guitar, Keyboard, Tabla, Violin, or Flute. Transparent pricing, flexible packages, and expert mentorship."
          canonicalPath="/courses"
        />
      )}

      <div className={hideHeroHeader ? "space-y-12" : "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12"}>
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-purple-100 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-saremi-secondary" />
            <span className="text-xs font-bold text-saremi-primary uppercase tracking-wider font-display">
              Live 1:1 Online Music Academy
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Select Your Course & Learning Plan
          </h1>

          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto">
            Experience joyful, structured music learning with live verified maestros, custom acoustic riyaaz tools, and graded certification.
          </p>
        </div>

        {/* STEP 1: CHOOSE MAIN COURSE */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-saremi-primary text-white text-xs font-bold flex items-center justify-center font-display">
                1
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                Choose Your Musical Discipline
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">6 Disciplines</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {COURSES_LIST.map((course) => {
              const isSelected = selectedCourseId === course.id;
              return (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`relative p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'border-saremi-primary bg-white shadow-saremi-purple ring-2 ring-saremi-primary/20 scale-[1.02]'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
                  }`}
                >
                  {course.isPremium && (
                    <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[10px] font-bold font-display shadow-xs flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5 fill-current" /> Premium
                    </span>
                  )}

                  <div className="space-y-2">
                    <span className="text-3xl sm:text-4xl block group-hover:scale-110 transition-transform">
                      {course.emoji}
                    </span>
                    <div>
                      <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 group-hover:text-saremi-primary transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                        {course.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                    <span className={isSelected ? 'text-saremi-primary' : 'text-slate-400'}>
                      {isSelected ? '✓ Selected' : 'Select'}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-0.5 text-saremi-primary' : 'text-slate-300'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* STEP 2: IF SINGING, SHOW SUB-CATEGORY SELECTION */}
        {selectedCourseId === 'singing' && (
          <motion.section 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 p-5 sm:p-7 bg-purple-50/50 rounded-3xl border border-purple-100 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-saremi-secondary text-white text-xs font-bold flex items-center justify-center font-display">
                2
              </span>
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                  Choose Your Vocal Program
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Select the vocal genre tailored to your age and musical goals.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {SINGING_SUB_PROGRAMS.map((sub) => {
                const isSelected = selectedSingingSub === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSingingSub(sub.id)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white flex flex-col justify-between ${
                      isSelected
                        ? 'border-saremi-secondary shadow-saremi-pink ring-2 ring-saremi-secondary/20'
                        : 'border-purple-100 hover:border-purple-200'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{sub.icon}</span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100/70 text-purple-900 font-display">
                          {sub.badge}
                        </span>
                      </div>

                      <h4 className="font-serif text-lg font-bold text-slate-900">
                        {sub.name}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {sub.tagline}
                      </p>
                    </div>

                    <div className="pt-4 mt-3 border-t border-purple-50 flex items-center justify-between">
                      <span className="text-[11px] font-bold font-mono text-slate-600">
                        {sub.formatNote}
                      </span>
                      <span className={`text-xs font-bold font-display ${isSelected ? 'text-saremi-secondary' : 'text-slate-400'}`}>
                        {isSelected ? '✓ Active' : 'Choose'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* STEP 3 & 4: LEARNING FORMAT & SESSION FREQUENCY */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Learning Format */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-saremi-primary text-white text-xs font-bold flex items-center justify-center font-display">
                  {selectedCourseId === 'singing' ? '3' : '2'}
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                  Learning Format
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1:1 Individual Classes */}
                <button
                  onClick={() => setLearningFormat('one_to_one')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    learningFormat === 'one_to_one'
                      ? 'border-saremi-primary bg-purple-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">👤</span>
                    {learningFormat === 'one_to_one' && (
                      <span className="w-5 h-5 rounded-full bg-saremi-primary text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <strong className="text-sm font-bold text-slate-900 block font-serif">
                    1:1 Individual Classes
                  </strong>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Dedicated maestro attention, custom pacing, and personalized feedback.
                  </p>
                </button>

                {/* Group Classes (Hindustani Vocals Only) */}
                {isGroupAllowed ? (
                  <button
                    onClick={() => setLearningFormat('group')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      learningFormat === 'group'
                        ? 'border-saremi-primary bg-purple-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xl">👥</span>
                      {learningFormat === 'group' && (
                        <span className="w-5 h-5 rounded-full bg-saremi-primary text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <strong className="text-sm font-bold text-slate-900 block font-serif">
                      Group Classes
                    </strong>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Small interactive batch (4–6 students), interactive riyaaz & peer harmony.
                    </p>
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 opacity-60 flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-400 font-display">
                      Group Classes Unavailable
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {currentCourse.name} is taught exclusively as 1:1 Individual Mentorship for optimal acoustic technique.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Session Frequency */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-saremi-primary text-white text-xs font-bold flex items-center justify-center font-display">
                  {selectedCourseId === 'singing' ? '4' : '3'}
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                  Class Frequency
                </h3>
              </div>

              {learningFormat === 'group' ? (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-left space-y-1">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm font-serif">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>8 Sessions / Month (Fixed for Group Classes)</span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium">
                    2 interactive group sessions per week (45 mins each) with live maestro coaching.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSessionsPerMonth(4)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                      sessionsPerMonth === 4
                        ? 'border-saremi-primary bg-purple-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl font-black text-slate-900 font-serif block">
                      4 Classes
                    </span>
                    <span className="text-xs font-bold text-slate-600 block mt-0.5">
                      1 Session / Week
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                      Ideal for steady paced learners
                    </span>
                  </button>

                  <button
                    onClick={() => setSessionsPerMonth(8)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer relative ${
                      sessionsPerMonth === 8
                        ? 'border-saremi-primary bg-purple-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-saremi-secondary text-white text-[9px] font-bold uppercase font-display shadow-xs">
                      Popular
                    </span>
                    <span className="text-2xl font-black text-slate-900 font-serif block">
                      8 Classes
                    </span>
                    <span className="text-xs font-bold text-slate-600 block mt-0.5">
                      2 Sessions / Week
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                      Fast-track progress & riyaaz
                    </span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* STEP 5: POPCORN PRICING CARDS (1 Month, 2 Months, 3 Months) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-saremi-primary uppercase tracking-wider font-display">
                Transparent Fee Structure • {getCourseDisplayName()}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900">
                Choose Your Tuition Package
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Longer commitments receive higher monthly savings. No hidden registration fees.
              </p>
            </div>

            {/* Popcorn Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3">
              {currentPackages.map((pkg) => {
                const isSelected = selectedDuration === pkg.duration;
                const isBest = pkg.isBestValue;

                return (
                  <div
                    key={pkg.duration}
                    onClick={() => setSelectedDuration(pkg.duration)}
                    className={`relative rounded-3xl transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                      isBest
                        ? 'p-6 sm:p-7 border-3 border-saremi-primary bg-gradient-to-b from-white to-purple-50/60 shadow-saremi-purple md:-translate-y-2'
                        : isSelected
                        ? 'p-6 border-2 border-slate-900 bg-white shadow-md'
                        : 'p-6 border-2 border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-4">
                      {isBest ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-saremi-primary text-saremi-yellow text-xs font-bold font-display shadow-xs">
                          <Crown className="w-3.5 h-3.5 fill-current" /> BEST VALUE • 15% OFF
                        </span>
                      ) : pkg.badge ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold font-display">
                          <Flame className="w-3.5 h-3.5 text-amber-600 fill-current" /> {pkg.badge}
                        </span>
                      ) : (
                        <span className="text-xs font-bold font-mono text-slate-400">
                          Standard Plan
                        </span>
                      )}

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-saremi-primary bg-saremi-primary text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Plan Duration & Monthly Display */}
                    <div className="space-y-2">
                      <h4 className="font-serif text-xl sm:text-2xl font-black text-slate-900">
                        {pkg.durationLabel}
                      </h4>

                      <div className="flex items-baseline gap-1.5">
                        <span className="font-serif text-3xl sm:text-4xl font-extrabold text-slate-900">
                          ₹{pkg.monthlyPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">/month</span>
                      </div>

                      {/* Total Package Price Highlight */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-mono">Total Payable:</span>
                          <strong className="text-slate-900 font-bold font-mono text-sm">
                            ₹{pkg.totalPrice.toLocaleString('en-IN')}
                          </strong>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {pkg.sessionsTotal} Live Classes (₹{Math.round(pkg.totalPrice / pkg.sessionsTotal)}/class)
                        </div>
                      </div>

                      {pkg.savingsLabel && (
                        <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{pkg.savingsLabel}</span>
                        </div>
                      )}
                    </div>

                    {/* Features list */}
                    <div className="pt-5 mt-5 border-t border-slate-100 space-y-2 text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Live 1:1 HD Acoustic Studio on Agora</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Tanpura, Tala & Pitch Accuracy Practice Tools</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Curriculum Notes, Sheet Audio & Recordings</span>
                      </div>
                      {isBest && (
                        <div className="flex items-center gap-2 text-saremi-primary font-bold">
                          <Award className="w-4 h-4 text-saremi-secondary shrink-0" />
                          <span>Graded Examination & Completion Certificate</span>
                        </div>
                      )}
                    </div>

                    {/* CTA on Card */}
                    <div className="pt-6 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDuration(pkg.duration);
                          handleEnrollNow(pkg.duration);
                        }}
                        className={`w-full py-3.5 px-4 rounded-2xl font-display font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isBest
                            ? 'bg-saremi-primary text-white hover:bg-purple-900 shadow-saremi-purple'
                            : isSelected
                            ? 'bg-slate-900 text-white hover:bg-slate-800'
                            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                        }`}
                      >
                        <span>Enroll for {pkg.durationLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* SUMMARY BOTTOM BAR WITH TRIAL CTA */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 text-amber-300 font-bold text-xs font-display">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Selected Plan Summary</span>
              </div>
              <h4 className="font-serif text-xl sm:text-2xl font-bold text-white">
                {getCourseDisplayName()} • {learningFormat === 'group' ? 'Group (8 Classes/Mo)' : `1:1 (${sessionsPerMonth} Classes/Mo)`} • {activePackage.durationLabel}
              </h4>
              <p className="text-xs text-slate-300 font-mono">
                Total Payable: <strong className="text-amber-300 text-sm font-bold">₹{activePackage.totalPrice.toLocaleString('en-IN')}</strong> for {activePackage.sessionsTotal} live sessions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
              <button
                onClick={onOpenBooking}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-display text-xs font-bold transition-colors cursor-pointer"
              >
                Book 1:1 Free Trial First
              </button>
              
              <SaremiButton
                variant="primary"
                size="lg"
                onClick={() => handleEnrollNow()}
                className="w-full sm:w-auto font-bold shadow-lg"
              >
                Proceed to Checkout →
              </SaremiButton>
            </div>
          </div>

        </section>

        {/* TRUST SIGNALS & FAQ HIGHLIGHTS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-left">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-saremi-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-slate-900">
              100% Satisfaction Guarantee
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              If your first scheduled class does not meet your expectations, we provide a full mentor reassignment or hassle-free refund.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-slate-900">
              Flexible Class Rescheduling
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Easily reschedule your 1:1 sessions up to 6 hours before class time directly from your student portal.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-slate-900">
              Recognized Music Certifications
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Complete level milestones, submit performance video assessments, and earn accredited Saremi graduation diplomas.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
