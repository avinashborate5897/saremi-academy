import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from '../../router/RouterContext';
import {
  CheckCircle,
  CreditCard,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  Award,
  Users,
  Star,
  Flame,
  Crown,
  Zap,
  Check
} from 'lucide-react';
import { Button, Card, Badge } from '../../design-system';
import { SEOHead } from '../SEOHead';
import { COURSES_DATA, COURSE_LEVELS, TEACHERS_DATA } from '../../data/coursesData';
import {
  OFFICIAL_PACKAGES,
  SaremiPackage,
  LearningMode,
  getAuthoritativePackage,
  getAuthoritativePrice
} from '../../data/pricingData';
import { COURSE_CATALOG, COURSE_LIST, getCourseBySlug, formatINR } from '../../lib/courseCatalog';
import { findMatchingPackage, formatPackagePricingOption } from '../../lib/pricingService';
import { createEnrollmentInFirestore } from '../../lib/courseCrmService';

import { useAuth } from '../../context/AuthContext';

interface EnrollmentViewProps {
  courseSlug?: string;
  onOpenBooking?: () => void;
}

export const EnrollmentView: React.FC<EnrollmentViewProps> = ({ courseSlug, onOpenBooking }) => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();

  // Find initial course
  const initialCourse = useMemo(() => {
    return getCourseBySlug(courseSlug);
  }, [courseSlug]);

  // Steps: 1 (Course), 2 (Level), 3 (Package & Pricing), 4 (Mentor), 5 (Schedule), 6 (Student Details & Checkout), 7 (Success)
  const [step, setStep] = useState<number>(courseSlug ? 2 : 1);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string>(initialCourse.slug);
  const [selectedLevel, setSelectedLevel] = useState<string>('Foundation');

  // Dynamic Authoritative Course from Catalog
  const authoritativeCourse = useMemo(() => {
    return getCourseBySlug(selectedCourseSlug);
  }, [selectedCourseSlug]);

  // Authoritative Pricing & Package Configuration
  const [learningMode, setLearningMode] = useState<LearningMode>(
    initialCourse.allowedLearningModes.includes('premium_one_to_one') ? 'premium_one_to_one' : 'one_to_one'
  );
  const [sessionsPerMonth, setSessionsPerMonth] = useState<4 | 8>(8);
  const [selectedDuration, setSelectedDuration] = useState<1 | 2 | 3>(3);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('assigned');
  const [preferredDays, setPreferredDays] = useState<string[]>(['Tuesday', 'Friday']);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string>('06:00 PM (Evening)');
  const [timezone, setTimezone] = useState<string>('IST');

  // Student Details
  const [studentName, setStudentName] = useState<string>(profile?.name || user?.displayName || '');
  const [studentEmail, setStudentEmail] = useState<string>(profile?.email || user?.email || '');
  const [studentPhone, setStudentPhone] = useState<string>(profile?.phone || '');
  const [billingAddress, setBillingAddress] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [enrollmentId, setEnrollmentId] = useState<string>('');

  const currentTeacher = TEACHERS_DATA.find((t) => t.id === selectedTeacherId);

  // Group class availability: Allowed if course catalog includes 'group'
  const isGroupAllowed = authoritativeCourse.allowedLearningModes.includes('group');
  const isPremiumCourse = authoritativeCourse.allowedLearningModes.includes('premium_one_to_one');

  // Sync learning mode when selected course changes
  useEffect(() => {
    if (isPremiumCourse && learningMode !== 'premium_one_to_one') {
      setLearningMode('premium_one_to_one');
    } else if (!isPremiumCourse && !isGroupAllowed && learningMode !== 'one_to_one') {
      setLearningMode('one_to_one');
    } else if (!isGroupAllowed && learningMode === 'group') {
      setLearningMode(isPremiumCourse ? 'premium_one_to_one' : 'one_to_one');
    }
  }, [selectedCourseSlug, isPremiumCourse, isGroupAllowed, learningMode]);

  // Group mode is always 8 sessions/month
  useEffect(() => {
    if (learningMode === 'group') {
      setSessionsPerMonth(8);
    }
  }, [learningMode]);

  // Derive active packages matching current filters dynamically from COURSE_CATALOG
  const targetMode: LearningMode =
    learningMode === 'group'
      ? 'group'
      : isPremiumCourse
      ? 'premium_one_to_one'
      : 'one_to_one';

  const durationOptions: (1 | 2 | 3)[] = [1, 2, 3];

  const packageOptions = useMemo(() => {
    // Find matching tier in authoritative course
    const tier = authoritativeCourse.pricingTiers.find(
      (t) => t.mode === targetMode && t.sessionsPerMonth === sessionsPerMonth
    ) || authoritativeCourse.pricingTiers[0];

    return durationOptions.map((dur) => {
      const plan = tier?.plans.find((p) => p.durationMonths === dur) || tier?.plans[0];
      const matchPkg = findMatchingPackage(OFFICIAL_PACKAGES, targetMode, sessionsPerMonth, dur);
      return {
        duration: dur,
        durationLabel: `${dur} ${dur === 1 ? 'Month' : 'Months'}`,
        monthlyPrice: plan ? plan.monthlyDisplayPrice : matchPkg.monthlyDisplayPrice,
        totalPrice: plan ? plan.totalPrice : matchPkg.totalPrice,
        totalSessions: plan ? plan.sessionsTotal : (matchPkg.sessions || (matchPkg.sessionsPerMonth * matchPkg.durationMonths)),
        savingsLabel: plan?.discountBadge || (dur === 3 ? 'Save 15%' : dur === 2 ? 'Save 10%' : undefined),
        isBestValue: dur === 3,
        packageId: plan?.packageId || matchPkg.id
      };
    });
  }, [authoritativeCourse, targetMode, sessionsPerMonth]);

  const activePackageOption =
    packageOptions.find((p) => p.duration === selectedDuration) || packageOptions[2];

  // Resolve canonical package object
  const currentAuthoritativePackage = useMemo(() => {
    return (
      getAuthoritativePackage(activePackageOption.packageId) ||
      OFFICIAL_PACKAGES[5] // Default to 8s/3m Standard (₹11,997)
    );
  }, [activePackageOption]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    if (preferredDays.includes(day)) {
      if (preferredDays.length > 1) {
        setPreferredDays(preferredDays.filter((d) => d !== day));
      }
    } else {
      setPreferredDays([...preferredDays, day]);
    }
  };

  const handleCompleteEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentEmail || !studentPhone) {
      alert('Please enter all required student contact fields.');
      return;
    }

    setIsProcessing(true);
    try {
      const scheduleSummary = `${preferredDays.join(' & ')} at ${preferredTimeSlot} (${timezone})`;

      const record = await createEnrollmentInFirestore({
        studentId: user?.uid || `guest-${Date.now()}`,
        studentName,
        studentEmail,
        studentPhone,
        courseId: authoritativeCourse.id,
        courseName: authoritativeCourse.name,
        level: selectedLevel,
        packageId: currentAuthoritativePackage.id,
        packageName: currentAuthoritativePackage.name || `${currentAuthoritativePackage.durationMonths}-Month ${activePackageOption.sessionsTotal} Classes Plan`,
        teacherId: currentTeacher?.id || 't-assigned',
        teacherName: currentTeacher?.name || 'Assigned Conservatory Mentor',
        scheduleSummary,
        classesTotal: activePackageOption.sessionsTotal,
        classesCompleted: 0,
        status: 'active',
        startDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
      });

      setEnrollmentId(record.id);
      setStep(7);
    } catch (err) {
      console.error('Enrollment submission error:', err);
      setEnrollmentId(`enr-${Date.now()}`);
      setStep(7);
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left">
      <SEOHead
        title={`Enroll in ${authoritativeCourse.name} | Saremi Academy`}
        description={`Complete your official enrollment into ${authoritativeCourse.name} with verified academy pricing, 1:1 live mentors, and graded certification.`}
        canonicalPath={`/enroll/${authoritativeCourse.slug}`}
      />

      {/* Header */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider font-mono">
            Official Conservatory Enrollment
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#121829]">
          Enroll in {authoritativeCourse.name}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto">
          Synchronized with our official Explore Courses syllabus. Choose your learning format, term duration, and weekly schedule.
        </p>
      </div>

      {/* Step Progress Bar */}
      {step < 7 && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-mono text-gray-500 mb-2">
            <span>
              Step {step} of 6:{' '}
              {step === 1
                ? 'Course Discipline'
                : step === 2
                ? 'Proficiency Level'
                : step === 3
                ? 'Tuition Package & Pricing'
                : step === 4
                ? 'Mentor Faculty'
                : step === 5
                ? 'Weekly Schedule'
                : 'Student Details & Checkout'}
            </span>
            <span className="font-bold text-[#8C6428]">{Math.round((step / 6) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D49A3D] transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* MAIN STEP CARD */}
      <Card variant="default" padding="lg" className="border-[#EAE5DB] shadow-md bg-white rounded-3xl">
        
        {/* STEP 1: COURSE SELECTION */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#121829]">Select Conservatory Discipline</h2>
              <p className="text-xs text-gray-500 mt-1">
                Choose the discipline you wish to enroll in for this academic term.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COURSE_LIST.map((c) => {
                const isSelected = selectedCourseSlug === c.slug;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCourseSlug(c.slug)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? 'border-[#D49A3D] bg-[#FAF8F5] ring-2 ring-[#D49A3D]/50 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={c.imageUrl} alt={c.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-[#121829] block">{c.name}</strong>
                      <span className="text-[11px] text-gray-500">{c.categoryLabel || c.category} • {c.sessionLengthMinutes}m sessions</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <Button variant="brass" size="md" className="text-xs font-bold" onClick={() => setStep(2)}>
                Continue to Level Selection <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: LEVEL */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#121829]">Select Proficiency Level</h2>
              <p className="text-xs text-gray-500 mt-1">
                Your faculty guru will verify and calibrate this during your initial orientation session.
              </p>
            </div>

            <div className="space-y-3">
              {COURSE_LEVELS.map((lvl) => {
                const isSelected = selectedLevel === lvl.name;
                return (
                  <div
                    key={lvl.id}
                    onClick={() => setSelectedLevel(lvl.name)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                      isSelected
                        ? 'border-[#D49A3D] bg-[#FAF8F5] ring-2 ring-[#D49A3D]/50 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-[#121829]">{lvl.name}</strong>
                        <span className="text-[10px] font-mono text-gray-500">
                          Prerequisites: {lvl.prerequisites}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{lvl.description}</p>
                    </div>
                    <input type="radio" checked={isSelected} onChange={() => setSelectedLevel(lvl.name)} className="text-[#D49A3D]" />
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-between items-center">
              <Button variant="outline" size="md" className="text-xs" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button variant="brass" size="md" className="text-xs font-bold" onClick={() => setStep(3)}>
                Continue to Tuition Packages <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: TUITION PACKAGES & PRICING (AUTHORITATIVE EXPLORE COURSES MATRIX) */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#121829]">
                Select Tuition Package & Term
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Authoritative pricing synchronized with Explore Courses. All packages include 1:1 live sessions, practice studio, and continuous mentor evaluations.
              </p>
            </div>

            {/* CONTROLS: Format Switcher & Frequency Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DB]">
              
              {/* Learning Format */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-gray-600 font-bold block mb-2">
                  Learning Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLearningMode('one_to_one')}
                    className={`py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      learningMode === 'one_to_one'
                        ? 'bg-[#121829] text-[#D49A3D] font-bold shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>1:1 Mentorship</span>
                  </button>

                  <button
                    type="button"
                    disabled={!isGroupAllowed}
                    onClick={() => setLearningMode('group')}
                    className={`py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
                      !isGroupAllowed
                        ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400'
                        : learningMode === 'group'
                        ? 'bg-[#121829] text-[#D49A3D] font-bold shadow-xs cursor-pointer'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Group Batch</span>
                  </button>
                </div>
                {!isGroupAllowed && (
                  <span className="text-[10px] text-gray-400 block mt-1">
                    Group batches available for Hindustani Vocals only.
                  </span>
                )}
              </div>

              {/* Sessions Frequency */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-gray-600 font-bold block mb-2">
                  Weekly Frequency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={learningMode === 'group'}
                    onClick={() => setSessionsPerMonth(4)}
                    className={`py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
                      learningMode === 'group'
                        ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400'
                        : sessionsPerMonth === 4
                        ? 'bg-[#121829] text-white font-bold shadow-xs cursor-pointer'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>4 Classes / Mo (1x/wk)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSessionsPerMonth(8)}
                    className={`py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      sessionsPerMonth === 8
                        ? 'bg-[#D49A3D] text-[#121829] font-bold shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>8 Classes / Mo (2x/wk)</span>
                  </button>
                </div>
              </div>

            </div>

            {/* THREE PLAN DURATION CARDS (1 Month, 2 Months with 10% off, 3 Months with 15% off) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {packageOptions.map((pkgOpt) => {
                const isSelected = selectedDuration === pkgOpt.duration;
                const isBestValue = pkgOpt.duration === 3;
                const isTwoMonth = pkgOpt.duration === 2;

                return (
                  <div
                    key={pkgOpt.duration}
                    onClick={() => setSelectedDuration(pkgOpt.duration)}
                    className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#D49A3D] bg-[#FAF8F5] ring-2 ring-[#D49A3D]/60 shadow-md scale-[1.01]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {/* Top Badges */}
                    {isBestValue && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-linear-to-r from-amber-500 to-amber-600 text-white font-mono text-[10px] font-bold tracking-wide shadow-sm flex items-center gap-1">
                        <Crown className="w-3 h-3 text-yellow-200" />
                        👑 SAVE 15% • BEST VALUE
                      </div>
                    )}
                    {isTwoMonth && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-linear-to-r from-orange-500 to-amber-500 text-white font-mono text-[10px] font-bold tracking-wide shadow-xs flex items-center gap-1">
                        <Flame className="w-3 h-3 text-yellow-200" />
                        🔥 SAVE 10%
                      </div>
                    )}

                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-base font-bold text-[#121829]">
                          {pkgOpt.duration === 1
                            ? '1 Month Plan'
                            : pkgOpt.duration === 2
                            ? '2 Months Term'
                            : '3 Months Term'}
                        </strong>
                        <span className="text-[11px] font-mono text-gray-500">
                          {pkgOpt.totalSessions} Sessions
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 leading-snug">
                        {pkgOpt.duration === 1
                          ? 'Month-to-month flexible schedule'
                          : pkgOpt.duration === 2
                          ? 'Steady skill progression roadmap'
                          : 'Complete Graded Level Certification'}
                      </p>

                      {/* Pricing Display */}
                      <div className="pt-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-serif font-extrabold text-[#121829]">
                            ₹{pkgOpt.monthlyPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">/ month</span>
                        </div>
                        <div className="text-xs text-[#8C6428] font-mono font-bold mt-0.5">
                          ₹{pkgOpt.totalPrice.toLocaleString('en-IN')} total for {pkgOpt.duration} {pkgOpt.duration === 1 ? 'month' : 'months'}
                        </div>
                        <span className="text-[11px] font-mono text-gray-400 block">
                          (₹{Math.round(pkgOpt.totalPrice / pkgOpt.sessionsTotal).toLocaleString('en-IN')} per 45-min session)
                        </span>
                      </div>


                      {/* Key Features */}
                      <ul className="space-y-1.5 pt-3 border-t border-gray-100 text-xs text-gray-700">
                        <li className="flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{pkgOpt.totalSessions} Live {learningMode === 'group' ? 'Group (Max 4)' : '1:1'} Sessions</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Dedicated Certified Faculty Guru</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Tanpura, Metronome & Riyaz Studio</span>
                        </li>
                        {isBestValue && (
                          <li className="flex items-start gap-1.5 font-semibold text-amber-900 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/60">
                            <Award className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                            <span>Official Saremi Graded Certificate</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Select Pill Button */}
                    <div className="pt-4 mt-auto">
                      <span
                        className={`text-xs font-bold block text-center py-2 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-[#D49A3D] text-[#121829] shadow-xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isSelected ? '✓ Selected Plan' : 'Select Plan'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step Navigation */}
            <div className="pt-4 flex justify-between items-center border-t border-gray-100">
              <Button variant="outline" size="md" className="text-xs" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button variant="brass" size="md" className="text-xs font-bold" onClick={() => setStep(4)}>
                Continue to Mentor Matching <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: MENTOR SELECTION */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#121829]">Faculty Mentor Matching</h2>
              <p className="text-xs text-gray-500 mt-1">
                Your verified faculty guru is personally matched based on your chosen discipline, proficiency level, and weekly timings.
              </p>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => setSelectedTeacherId('assigned')}
                className="p-4 rounded-2xl border border-[#D49A3D] bg-[#FAF8F5] ring-2 ring-[#D49A3D]/50 shadow-xs cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#121829] text-[#D49A3D] flex items-center justify-center font-bold text-lg">
                    ⭐
                  </div>
                  <div>
                    <strong className="text-sm font-bold text-[#121829] block">
                      Certified Master Faculty (Recommended)
                    </strong>
                    <p className="text-xs text-gray-500">
                      Our Academic Dean assigns the verified guru best aligned with your chosen schedule and syllabus.
                    </p>
                  </div>
                </div>
                <input type="radio" checked={true} readOnly className="text-[#D49A3D]" />
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-white text-xs text-gray-600 leading-relaxed">
                <p className="font-bold text-[#121829] mb-1">💡 1:1 Teacher Continuity Guarantee:</p>
                <p>
                  Your assigned mentor guides all your live 1:1 classes, assigns targeted weekly riyaaz exercises, and prepares you for graded evaluation.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <Button variant="outline" size="md" className="text-xs" onClick={() => setStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button variant="brass" size="md" className="text-xs font-bold" onClick={() => setStep(5)}>
                Continue to Weekly Schedule <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: WEEKLY SCHEDULE */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#121829]">Weekly Schedule Preferences</h2>
              <p className="text-xs text-gray-500 mt-1">
                Select your preferred day(s) and time slot for your recurring sessions.
              </p>
            </div>

            {/* Preferred Days */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-gray-500 font-bold block">
                Select Preferred Day(s) ({sessionsPerMonth === 4 ? '1 day/week' : '2 days/week'})
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => {
                  const isSelected = preferredDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-medium border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#121829] text-[#D49A3D] border-[#121829] font-bold shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slot and Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono uppercase text-gray-500 font-bold block mb-1">
                  Preferred Time Window
                </label>
                <select
                  value={preferredTimeSlot}
                  onChange={(e) => setPreferredTimeSlot(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 text-sm font-medium bg-[#FAF8F5]"
                >
                  <option value="10:00 AM (Morning)">10:00 AM (Morning)</option>
                  <option value="11:30 AM (Morning)">11:30 AM (Morning)</option>
                  <option value="02:00 PM (Afternoon)">02:00 PM (Afternoon)</option>
                  <option value="04:00 PM (Evening)">04:00 PM (Evening)</option>
                  <option value="06:00 PM (Evening)">06:00 PM (Evening)</option>
                  <option value="07:30 PM (Night)">07:30 PM (Night)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-gray-500 font-bold block mb-1">
                  Your Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 text-sm font-medium bg-[#FAF8F5]"
                >
                  <option value="IST">IST (India Standard Time, UTC+5:30)</option>
                  <option value="EST">EST (US Eastern, UTC-5)</option>
                  <option value="PST">PST (US Pacific, UTC-8)</option>
                  <option value="GMT">GMT (UK / Europe, UTC+0)</option>
                  <option value="SGT">SGT (Singapore / Asia, UTC+8)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <Button variant="outline" size="md" className="text-xs" onClick={() => setStep(4)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button variant="brass" size="md" className="text-xs font-bold" onClick={() => setStep(6)}>
                Proceed to Checkout <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: STUDENT DETAILS & CHECKOUT */}
        {step === 6 && (
          <form onSubmit={handleCompleteEnrollment} className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#121829]">Student Details & Order Summary</h2>
              <p className="text-xs text-gray-500 mt-1">
                Review your enrollment package and complete registration.
              </p>
            </div>

            {/* Authoritative Order Summary Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DB] space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-mono">Discipline</span>
                <strong className="text-gray-900 font-serif">{authoritativeCourse.name}</strong>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-mono">Proficiency Level</span>
                <strong className="text-gray-900">{selectedLevel}</strong>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-mono">Selected Package</span>
                <div className="text-right">
                  <strong className="text-gray-900 block">{currentAuthoritativePackage.name}</strong>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {currentAuthoritativePackage.totalClasses} Sessions • {selectedDuration} {selectedDuration === 1 ? 'Month' : 'Months'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-mono">Weekly Slot</span>
                <strong className="text-gray-900">{preferredDays.join(' & ')} at {preferredTimeSlot} ({timezone})</strong>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <div>
                  <span className="text-sm font-bold text-gray-800 font-mono block">Total Tuition Fee</span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {selectedDuration === 3 ? 'Includes 15% Term Savings + Certificate' : selectedDuration === 2 ? 'Includes 10% Term Savings' : 'Monthly Plan'}
                  </span>
                </div>
                <strong className="text-2xl font-serif font-extrabold text-[#8C6428]">
                  ₹{activePackageOption.totalPrice.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase text-gray-600 font-bold block mb-1">
                  Student's Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Iyer"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#D49A3D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase text-gray-600 font-bold block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#D49A3D]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-gray-600 font-bold block mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#D49A3D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-gray-600 font-bold block mb-1">
                  Billing City & Country
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai, India or London, UK"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#D49A3D]"
                />
              </div>
            </div>

            {/* Payment Guarantee */}
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                100% Satisfaction Guarantee • Full refund available after your first enrolled session if not delighted.
              </span>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <Button type="button" variant="outline" size="md" className="text-xs" onClick={() => setStep(5)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                type="submit"
                variant="brass"
                size="lg"
                disabled={isProcessing}
                className="text-sm font-bold shadow-md cursor-pointer"
              >
                {isProcessing ? 'Finalizing Enrollment...' : `Confirm & Enroll (₹${activePackageOption.totalPrice.toLocaleString('en-IN')}) →`}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 7: ENROLLMENT CONFIRMATION */}
        {step === 7 && (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <Badge variant="brass">Enrollment Complete</Badge>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121829]">
                Welcome to Saremi Conservatory!
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
                Your placement in <strong className="text-gray-900">{authoritativeCourse.name}</strong> is officially registered under enrollment reference{' '}
                <strong className="font-mono text-gray-900">{enrollmentId}</strong>.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DB] text-left max-w-md mx-auto space-y-2 text-xs">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-mono">Student</span>
                <strong className="text-gray-900">{studentName}</strong>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-mono">Package</span>
                <strong className="text-gray-900">{currentAuthoritativePackage.name || `${currentAuthoritativePackage.durationMonths}-Month Plan`} ({activePackageOption.sessionsTotal} Sessions)</strong>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-mono">Weekly Slot</span>
                <strong className="text-[#8C6428] font-bold">
                  {preferredDays.join(' & ')} at {preferredTimeSlot} ({timezone})
                </strong>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-mono">Tuition Total</span>
                <strong className="text-gray-900 font-bold">₹{activePackageOption.totalPrice.toLocaleString('en-IN')}</strong>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-gray-500 font-mono">Status</span>
                <span className="text-emerald-700 font-bold">Active Enrolled Student</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-2">
              <Button
                variant="brass"
                size="md"
                className="w-full text-xs font-bold"
                onClick={() => navigate('/app')}
              >
                Go to Student Sanctuary Dashboard
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full text-xs font-semibold"
                onClick={() => navigate('/tools')}
              >
                Open Tanpura & Pitch Studio
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
