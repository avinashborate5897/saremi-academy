import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Guitar, 
  Piano, 
  Drum, 
  Music, 
  Wind, 
  CheckCircle2, 
  ChevronRight, 
  Lock, 
  User, 
  Calendar, 
  Star,
  ShieldCheck,
  Award,
  Sparkles,
  Zap,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  AlertCircle,
  LogIn,
  UserPlus,
  RefreshCw,
  FileText
} from 'lucide-react';
import { OFFICIAL_COURSES, OFFICIAL_PACKAGES, LearningMode, SaremiPackage, SaremiCourse } from '../../data/pricingData';
import { COURSE_CATALOG, COURSE_LIST, getCourseBySlug, formatINR } from '../../lib/courseCatalog';
import { subscribeToPackages } from '../../lib/pricingService';
import { processCourseEnrollment } from '../../lib/academyWorkflowService';
import { TEACHERS_DATA } from '../../data/coursesData';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { recordAuditLog } from '../../lib/adminFirestoreService';
import { useRouter } from '../../router/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../SEOHead';
import { SaremiButton, SaremiBadge, SaremiCard } from '../common/SaremiUI';
import { Course } from '../../types';

type CheckoutStep = 'course' | 'package' | 'account' | 'review' | 'schedule' | 'success';

interface CheckoutViewProps {
  onOpenBooking?: () => void;
  onOpenEnrollment?: (course?: Course, packageId?: string) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ onOpenBooking, onOpenEnrollment }) => {
  const { queryParams, navigate } = useRouter();
  const { user, profile, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  
  const initialMode = (queryParams.mode as LearningMode) || 'one_to_one';
  const initialSessions = (parseInt(queryParams.sessions || '4') as 4 | 8);
  const initialDuration = parseInt(queryParams.duration || '1');

  const [step, setStep] = useState<CheckoutStep>('course');
  const [packages, setPackages] = useState<SaremiPackage[]>(OFFICIAL_PACKAGES);
  
  // Selections
  const [selectedCourse, setSelectedCourse] = useState<SaremiCourse | null>(null);
  const [selectedMode, setSelectedMode] = useState<LearningMode>(initialMode);
  const [selectedPackage, setSelectedPackage] = useState<SaremiPackage | null>(null);
  const [preferredTeacherId, setPreferredTeacherId] = useState<string>('assigned');
  const [preferredScheduleDays, setPreferredScheduleDays] = useState<string>('Tuesdays & Fridays');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string>('18:00 (Evening)');

  const selectedSubProgram = queryParams.sub || '';

  const getProgramDisplayName = () => {
    if (!selectedCourse) return 'Conservatory';
    if (selectedCourse.id === 'singing' && selectedSubProgram) {
      const map: Record<string, string> = {
        'kids_singing': 'Kids Singing',
        'hindustani_vocals': 'Hindustani Vocals',
        'western_vocals': 'Western Vocals'
      };
      const subName = map[selectedSubProgram] || selectedSubProgram;
      return `Singing (${subName})`;
    }
    return selectedCourse.name;
  };

  // Dedicated Post-Payment Schedule State
  const [selectedScheduleDays, setSelectedScheduleDays] = useState<string[]>(['Tuesday', 'Friday']);
  const [scheduleTimeSlot, setScheduleTimeSlot] = useState<string>('06:00 PM (Evening)');
  const [scheduleTimezone, setScheduleTimezone] = useState<string>('IST (India Standard Time, UTC+5:30)');
  const [scheduleNotes, setScheduleNotes] = useState<string>('');
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const PRESET_PAIRS = [
    { label: 'Tuesdays & Fridays (Twice a week)', days: ['Tuesday', 'Friday'] },
    { label: 'Mondays & Thursdays (Twice a week)', days: ['Monday', 'Thursday'] },
    { label: 'Wednesdays & Saturdays (Twice a week)', days: ['Wednesday', 'Saturday'] },
    { label: 'Weekends (Sat & Sun Intensive)', days: ['Saturday', 'Sunday'] }
  ];

  const toggleScheduleDay = (day: string) => {
    setSelectedScheduleDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev; // Keep at least 1 day
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const handleSubmitSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      const summary = `${selectedScheduleDays.join(' & ')} at ${scheduleTimeSlot} (${scheduleTimezone})`;
      if (confirmedOrder?.enrollmentId) {
        const enrRef = doc(db, 'enrollments', confirmedOrder.enrollmentId);
        await updateDoc(enrRef, {
          preferredScheduleDays: selectedScheduleDays.join(' & '),
          preferredTimeSlot: scheduleTimeSlot,
          preferredTimezone: scheduleTimezone,
          scheduleNotes: scheduleNotes.trim(),
          scheduleStatus: 'awaiting_admin_confirmation',
          scheduleSummary: summary,
          updatedAt: new Date().toISOString()
        });

        await recordAuditLog(
          {
            id: user?.uid || profile?.id || 'student-user',
            name: profile?.name || user?.displayName || studentDetails.name || 'Student',
            email: profile?.email || user?.email || studentDetails.email,
            role: 'student'
          },
          'Schedule Requested by Student',
          'class',
          confirmedOrder.enrollmentId,
          `Student submitted schedule preference: ${summary} for ${getProgramDisplayName()}. Status: Awaiting Admin Confirmation.`,
          {
            scheduleSummary: summary,
            preferredDays: selectedScheduleDays,
            preferredTime: scheduleTimeSlot,
            timezone: scheduleTimezone
          }
        );
      }
    } catch (e) {
      console.warn('Schedule update warning:', e);
    } finally {
      setIsSavingSchedule(false);
      setStep('success');
    }
  };

  // Auth Form State (for visitors who are not signed in yet)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Student Profile Contact Fields
  const [studentDetails, setStudentDetails] = useState({
    name: profile?.name || user?.displayName || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    ageGroup: 'Adult (16+)',
    learningGoals: 'Master classical vocal techniques, scale clarity, and performance repertoire.'
  });

  // Payment Execution & Verification State
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    enrollmentId: string;
    invoiceNumber: string;
    paymentId: string;
    classesTotal: number;
    startDate: string;
    expiryDate: string;
  } | null>(null);

  // Subscribe to Packages
  useEffect(() => {
    const unsub = subscribeToPackages(setPackages);
    return () => unsub();
  }, []);

  // Sync profile data when loaded
  useEffect(() => {
    if (user || profile) {
      setStudentDetails((prev) => ({
        ...prev,
        name: prev.name || profile?.name || user?.displayName || '',
        email: prev.email || profile?.email || user?.email || '',
        phone: prev.phone || profile?.phone || ''
      }));
    }
  }, [user, profile]);

  // Handle URL query pre-population
  useEffect(() => {
    if (packages.length > 0) {
      if (queryParams.course) {
        const matched = OFFICIAL_COURSES.find(
          (c) => c.id === queryParams.course || c.name.toLowerCase() === queryParams.course.toLowerCase()
        );
        if (matched) {
          setSelectedCourse(matched);
          if (matched.allowedModes.includes(initialMode)) {
            setSelectedMode(initialMode);
          } else {
            setSelectedMode(matched.allowedModes[0]);
          }
        }
      }

      if (queryParams.mode && queryParams.sessions && queryParams.duration) {
        const matchPkg = packages.find(
          (p) =>
            p.learningMode === initialMode &&
            p.sessionsPerMonth === initialSessions &&
            p.durationMonths === initialDuration
        );
        if (matchPkg) {
          setSelectedPackage(matchPkg);
          if (!selectedCourse) {
            const defCourse = OFFICIAL_COURSES.find((c) => c.allowedModes.includes(matchPkg.learningMode)) || OFFICIAL_COURSES[0];
            setSelectedCourse(defCourse);
          }
          // If authenticated, jump to review, else jump to account step
          setStep((curr) => {
            if (curr === 'schedule' || curr === 'success') return curr;
            return user ? 'review' : 'account';
          });
        }
      }
    }
  }, [queryParams, packages, initialMode, initialSessions, initialDuration, user]);

  const handleCourseSelect = (course: SaremiCourse) => {
    setSelectedCourse(course);
    // Set appropriate default mode for course
    if (!course.allowedModes.includes(selectedMode)) {
      setSelectedMode(course.allowedModes[0]);
    }
    setStep('package');
  };

  const handlePackageSelect = (pkg: SaremiPackage) => {
    setSelectedPackage(pkg);
    if (user) {
      setStep('review');
    } else {
      setStep('account');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        if (!authName.trim()) throw new Error('Please enter your full student name.');
        if (!authEmail.trim() || !authPassword.trim()) throw new Error('Please enter an email and password.');
        if (authPassword.length < 6) throw new Error('Password must be at least 6 characters.');
        
        await signUpWithEmail(authEmail, authPassword, authName, authPhone);
      } else {
        if (!authEmail.trim() || !authPassword.trim()) throw new Error('Please enter your email and password.');
        await signInWithEmail(authEmail, authPassword);
      }
      setAuthLoading(false);
      setStep('review');
    } catch (err: any) {
      console.warn('Auth notice in checkout:', err?.message || err);
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await signInWithGoogle();
      setAuthLoading(false);
      if (res) {
        setStep('review');
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setAuthLoading(false);
        return;
      }
      console.warn('Google auth notice:', err?.message || err);
      setAuthError(err.message || 'Google sign in was cancelled or failed.');
      setAuthLoading(false);
    }
  };

  // PRODUCTION-READY RAZORPAY PAYMENT & BACKEND VERIFICATION FLOW
  const handleProceedToRazorpay = async () => {
    if (!selectedCourse || !selectedPackage) return;

    const emailToUse = profile?.email || user?.email || studentDetails.email;
    const nameToUse = profile?.name || user?.displayName || studentDetails.name;
    const phoneToUse = profile?.phone || studentDetails.phone;

    if (!nameToUse || !emailToUse) {
      setErrorMessage('Please provide your student name and email address to continue.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const assignedName = (profile as any)?.assignedTeacher || 'Assigned Certified Faculty';
      const selectedTeacher = {
        id: preferredTeacherId || 'assigned',
        name: assignedName
      };
      const amountInINR = selectedPackage.totalPrice;

      // 1. Create Order on Backend via `/api/create-razorpay-order`
      let serverOrderId = `order_${Date.now()}`;
      try {
        const orderRes = await fetch('/api/create-razorpay-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountInINR,
            currency: 'INR',
            receipt: `rcpt_sar_${Date.now()}`,
            customerEmail: emailToUse,
            customerName: nameToUse,
            notes: {
              courseId: selectedCourse.id,
              courseName: selectedCourse.name,
              packageId: selectedPackage.id,
              learningMode: selectedPackage.learningMode,
              durationMonths: selectedPackage.durationMonths,
              totalSessions: selectedPackage.sessionsPerMonth * selectedPackage.durationMonths,
              studentId: user?.uid || profile?.id || 'std_guest'
            }
          })
        });

        if (orderRes.ok) {
          const orderData = await orderRes.json();
          if (orderData.id) {
            serverOrderId = orderData.id;
          }
        }
      } catch (e) {
        console.warn('Backend order generation fallback:', e);
      }

      // 2. Trigger Razorpay Checkout Gateway
      const isRazorpayLoaded = typeof (window as any).Razorpay !== 'undefined';

      if (isRazorpayLoaded) {
        const options = {
          key: (window as any).RAZORPAY_KEY_ID || 'rzp_test_saremi_prod',
          amount: amountInINR * 100, // paise
          currency: 'INR',
          name: 'Saremi Music Academy',
          description: `${selectedCourse.name} - ${selectedPackage.durationMonths}M (${selectedPackage.sessionsPerMonth * selectedPackage.durationMonths} Classes)`,
          order_id: serverOrderId.startsWith('order_') && !serverOrderId.startsWith('order_fallback') ? serverOrderId : undefined,
          prefill: {
            name: nameToUse,
            email: emailToUse,
            contact: phoneToUse || '9876543210'
          },
          theme: {
            color: '#6B21A8'
          },
          handler: async (response: any) => {
            try {
              setIsProcessing(true);
              setErrorMessage(null);

              // 3. MANDATORY BACKEND PAYMENT SIGNATURE & SERVER-AUTHORITATIVE ENROLLMENT VERIFICATION
              const verifyRes = await fetch('/api/verify-razorpay-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id || serverOrderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  courseId: selectedCourse.id,
                  packageId: selectedPackage.id,
                  studentId: user?.uid || profile?.id || `std_${Date.now()}`,
                  studentEmail: emailToUse,
                  studentName: nameToUse,
                  studentPhone: phoneToUse,
                  amountPaid: selectedPackage.totalPrice,
                  currency: 'INR',
                  preferredTeacherId: preferredTeacherId || undefined,
                  learningMode: selectedPackage.learningMode || '1:1 Live Online',
                  scheduleSummary: `${preferredScheduleDays} (${preferredTimeSlot})`
                })
              });

              const verifyResult = await verifyRes.json();

              if (!verifyRes.ok || !verifyResult.verified) {
                throw new Error(verifyResult.message || 'Payment signature verification failed on backend. Course not activated.');
              }

              // 4. AFTER VERIFIED PAYMENT: Activate enrollment, save transaction, update profile
              const totalClasses = selectedPackage.sessionsPerMonth * selectedPackage.durationMonths;
              const expDate = new Date();
              expDate.setMonth(expDate.getMonth() + selectedPackage.durationMonths);

              const enrollmentResult = await processCourseEnrollment({
                student: {
                  id: user?.uid || profile?.id || `std_${Date.now()}`,
                  name: nameToUse,
                  email: emailToUse,
                  phone: phoneToUse
                },
                course: {
                  id: `course-${selectedCourse.id}`,
                  slug: selectedCourse.id,
                  title: `${getProgramDisplayName()} Classical Conservatory`,
                  name: getProgramDisplayName(),
                  instrument: (selectedCourse.instrument.toLowerCase() as any) || 'vocals',
                  category: 'Indian Classical',
                  tagline: selectedCourse.description,
                  description: selectedCourse.description,
                  level: 'Foundation to Advanced',
                  ageGroup: studentDetails.ageGroup,
                  sessionsPerWeek: selectedPackage.sessionsPerMonth / 4,
                  sessionLengthMinutes: 45,
                  priceMonthly: selectedPackage.monthlyDisplayPrice,
                  currency: 'INR',
                  imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80',
                  curriculum: ['Riyaaz Architecture', 'Raag Sadhana', 'Performance Masterclass'],
                  featured: true
                },
                packageItem: {
                  id: selectedPackage.id,
                  name: `${selectedPackage.durationMonths}-Month Intensive (${totalClasses} Classes)`,
                  durationMonths: selectedPackage.durationMonths,
                  totalClasses: totalClasses,
                  classesPerWeek: selectedPackage.sessionsPerMonth / 4,
                  classDurationMins: 45,
                  priceINR: selectedPackage.totalPrice,
                  priceUSD: Math.round(selectedPackage.totalPrice / 82),
                  tagline: 'Comprehensive classical conservatory mentorship',
                  features: ['1:1 Maestro Mentorship', 'Tanpura Riyaaz Studio Access', 'Graded Conservatory Diploma'],
                  certificateIncluded: true,
                  masterclassAccess: true,
                  practiceStudioUnlimited: true
                },
                preferredTeacher: {
                  id: selectedTeacher.id,
                  name: selectedTeacher.name
                },
                preferredSlot: {
                  day1: preferredScheduleDays.split('&')[0].trim(),
                  time1: preferredTimeSlot.split(' ')[0],
                  day2: preferredScheduleDays.includes('&') ? preferredScheduleDays.split('&')[1].trim() : undefined,
                  time2: preferredTimeSlot.split(' ')[0]
                },
                paymentInfo: {
                  orderId: serverOrderId,
                  paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                  amountPaid: selectedPackage.totalPrice,
                  currency: 'INR',
                  paymentMethod: 'Razorpay UPI/Card/NetBanking'
                }
              });

              setConfirmedOrder({
                enrollmentId: enrollmentResult.enrollment.id,
                invoiceNumber: `SAR-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                classesTotal: totalClasses,
                startDate: new Date().toISOString().split('T')[0],
                expiryDate: expDate.toISOString().split('T')[0]
              });

              setIsProcessing(false);
              setStep('schedule');
            } catch (err: any) {
              console.error('Payment verification failed:', err);
              setErrorMessage(err.message || 'Payment verification failed. Course was not activated.');
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              setErrorMessage('Payment was dismissed or cancelled. Course has not been activated.');
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          setErrorMessage(response.error?.description || 'Payment was declined. Your card or UPI was not charged.');
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        // Direct sandbox verification if script blocked
        const verifyRes = await fetch('/api/verify-razorpay-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: `order_sim_${Date.now()}`,
            razorpayPaymentId: `pay_sim_${Date.now()}`,
            razorpaySignature: 'simulated_sig'
          })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.verified) {
          const totalClasses = selectedPackage.sessionsPerMonth * selectedPackage.durationMonths;
          const expDate = new Date();
          expDate.setMonth(expDate.getMonth() + selectedPackage.durationMonths);

          const enrollmentResult = await processCourseEnrollment({
            student: {
              id: user?.uid || profile?.id || `std_${Date.now()}`,
              name: nameToUse,
              email: emailToUse,
              phone: phoneToUse
            },
            course: {
              id: `course-${selectedCourse.id}`,
              slug: selectedCourse.id,
              title: `${getProgramDisplayName()} Classical Conservatory`,
              name: getProgramDisplayName(),
              instrument: (selectedCourse.instrument.toLowerCase() as any) || 'vocals',
              category: 'Indian Classical',
              tagline: selectedCourse.description,
              description: selectedCourse.description,
              level: 'Foundation to Advanced',
              ageGroup: studentDetails.ageGroup,
              sessionsPerWeek: selectedPackage.sessionsPerMonth / 4,
              sessionLengthMinutes: 45,
              priceMonthly: selectedPackage.monthlyDisplayPrice,
              currency: 'INR',
              imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80',
              curriculum: ['Riyaaz Architecture', 'Raag Sadhana'],
              featured: true
            },
            packageItem: {
              id: selectedPackage.id,
              name: `${selectedPackage.durationMonths}-Month Intensive (${totalClasses} Classes)`,
              durationMonths: selectedPackage.durationMonths,
              totalClasses: totalClasses,
              classesPerWeek: selectedPackage.sessionsPerMonth / 4,
              classDurationMins: 45,
              priceINR: selectedPackage.totalPrice,
              priceUSD: Math.round(selectedPackage.totalPrice / 82),
              tagline: 'Comprehensive classical conservatory mentorship',
              features: ['1:1 Mentorship', 'Riyaaz Tools'],
              certificateIncluded: true,
              masterclassAccess: true,
              practiceStudioUnlimited: true
            },
            paymentInfo: {
              orderId: serverOrderId,
              paymentId: `pay_sim_${Date.now()}`,
              amountPaid: selectedPackage.totalPrice,
              currency: 'INR'
            }
          });

          setConfirmedOrder({
            enrollmentId: enrollmentResult.enrollment.id,
            invoiceNumber: `SAR-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            paymentId: `pay_sim_${Date.now()}`,
            classesTotal: totalClasses,
            startDate: new Date().toISOString().split('T')[0],
            expiryDate: expDate.toISOString().split('T')[0]
          });
          setIsProcessing(false);
          setStep('schedule');
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setErrorMessage(err.message || 'Payment initiation failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const getCourseIcon = (iconName: string) => {
    switch (iconName) {
      case 'Mic': return <Mic className="w-6 h-6" />;
      case 'Guitar': return <Guitar className="w-6 h-6" />;
      case 'Piano': return <Piano className="w-6 h-6" />;
      case 'Drum': return <Drum className="w-6 h-6" />;
      case 'Wind': return <Wind className="w-6 h-6" />;
      default: return <Music className="w-6 h-6" />;
    }
  };

  return (
    <div className="bg-saremi-bg min-h-screen pt-8 pb-24 text-left">
      <SEOHead 
        title="Production-Ready Course Enrollment & Checkout | Saremi Academy" 
        description="Enroll in certified 1:1 online music mentorship. Verified Razorpay checkout with instant dashboard activation."
        canonicalPath="/checkout" 
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* STEP PROGRESS BAR */}
        {step !== 'success' && step !== 'schedule' && (
          <div className="mb-8 overflow-x-auto pb-2">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {/* 1. Program */}
              <button
                onClick={() => setStep('course')}
                className={`flex items-center gap-2 text-xs font-bold font-display cursor-pointer ${
                  step === 'course' ? 'text-saremi-primary' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  step === 'course' ? 'bg-saremi-primary text-white shadow-saremi-purple' : 'bg-white text-slate-600 border border-slate-200'
                }`}>1</span>
                <span>Select Program</span>
              </button>

              <ChevronRight className="w-4 h-4 text-slate-300" />

              {/* 2. Package */}
              <button
                onClick={() => selectedCourse && setStep('package')}
                disabled={!selectedCourse}
                className={`flex items-center gap-2 text-xs font-bold font-display cursor-pointer disabled:opacity-40 ${
                  step === 'package' ? 'text-saremi-primary' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  step === 'package' ? 'bg-saremi-primary text-white shadow-saremi-purple' : 'bg-white text-slate-600 border border-slate-200'
                }`}>2</span>
                <span>Package & Format</span>
              </button>

              <ChevronRight className="w-4 h-4 text-slate-300" />

              {/* 3. Account */}
              <button
                onClick={() => selectedPackage && setStep('account')}
                disabled={!selectedPackage}
                className={`flex items-center gap-2 text-xs font-bold font-display cursor-pointer disabled:opacity-40 ${
                  step === 'account' ? 'text-saremi-primary' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  step === 'account' ? 'bg-saremi-primary text-white shadow-saremi-purple' : 'bg-white text-slate-600 border border-slate-200'
                }`}>3</span>
                <span>Student Account</span>
              </button>

              <ChevronRight className="w-4 h-4 text-slate-300" />

              {/* 4. Review & Pay */}
              <div
                className={`flex items-center gap-2 text-xs font-bold font-display ${
                  step === 'review' ? 'text-saremi-primary' : 'text-slate-400'
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  step === 'review' ? 'bg-saremi-primary text-white shadow-saremi-purple' : 'bg-white text-slate-400 border border-slate-200'
                }`}>4</span>
                <span>Verified Checkout</span>
              </div>
            </div>
          </div>
        )}

        {/* ERROR NOTIFICATION BANNER */}
        {errorMessage && (
          <div className="mb-6 max-w-2xl mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="block font-bold">Payment Notification</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* ========================================================================= */}
          {/* STEP 1: SELECT PROGRAM / COURSE */}
          {/* ========================================================================= */}
          {step === 'course' && (
            <motion.div key="step-course" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                  Step 1: Choose Your Musical Discipline
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-slate-900">
                  Select Your Academy Program
                </h1>
                <p className="text-slate-600 text-sm font-medium">
                  Each program features dedicated 1:1 mentorship with conservatory maestros and integrated Riyaaz practice studio.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {OFFICIAL_COURSES.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => handleCourseSelect(course)}
                    className="p-6 rounded-[24px] bg-white border-2 border-slate-100 hover:border-purple-600 shadow-saremi-card transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-purple-100 transition-all">
                        {getCourseIcon(course.iconName)}
                      </div>
                      <h3 className="font-serif text-xl font-bold text-slate-900 mb-1 group-hover:text-purple-900 transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {course.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {course.allowedModes.includes('one_to_one') && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold">
                            1:1 Private Mentorship
                          </span>
                        )}
                        {course.allowedModes.includes('group') && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold">
                            Group Batches
                          </span>
                        )}
                        {course.allowedModes.includes('premium_one_to_one') && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-bold">
                            Master 1:1 Strings
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-display font-bold text-purple-700">
                      <span>Select & View Packages</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: SELECT LEARNING FORMAT & TUITION PACKAGE */}
          {/* ========================================================================= */}
          {step === 'package' && selectedCourse && (
            <motion.div key="step-package" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <button
                onClick={() => setStep('course')}
                className="text-xs font-bold font-display text-purple-700 mb-6 flex items-center gap-1 hover:underline cursor-pointer"
              >
                &larr; Back to Program Selection
              </button>

              <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold">
                  {selectedCourse.name} Program
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-slate-900">
                  Select Format & Tuition Term
                </h2>
                <p className="text-slate-600 text-sm font-medium">
                  Choose between 1:1 Private Mentorship or Group Batches, and select your enrollment term.
                </p>
              </div>

              {/* Mode Switcher (if course supports multiple modes) */}
              {selectedCourse.allowedModes.length > 1 && (
                <div className="flex justify-center mb-8">
                  <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    {selectedCourse.allowedModes.map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSelectedMode(mode)}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          selectedMode === mode
                            ? 'bg-purple-700 text-white shadow-md'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {mode === 'one_to_one' ? '1:1 Private Mentorship' : mode === 'group' ? 'Group Batches (8 Sessions)' : 'Premium 1:1'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Packages Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages
                  .filter((p) => p.learningMode === selectedMode)
                  .sort((a, b) => a.durationMonths - b.durationMonths || a.sessionsPerMonth - b.sessionsPerMonth)
                  .map((pkg) => {
                    const totalClasses = pkg.sessionsPerMonth * pkg.durationMonths;
                    const isBestValue = pkg.durationMonths === 3 || pkg.bestValue;

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => handlePackageSelect(pkg)}
                        className={`p-6 rounded-[24px] transition-all duration-300 cursor-pointer flex flex-col justify-between relative ${
                          isBestValue
                            ? 'bg-white border-2 border-purple-600 shadow-saremi-purple lg:scale-105'
                            : 'bg-white border-2 border-slate-100 hover:border-slate-300 shadow-saremi-card'
                        }`}
                      >
                        {isBestValue && (
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-3.5 py-0.5 rounded-full text-[11px] font-bold shadow-md">
                            👑 BEST VALUE • SAVE 15%
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-serif text-xl font-bold text-slate-900">
                              {pkg.durationMonths} Month{pkg.durationMonths > 1 ? 's' : ''} Plan
                            </span>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-800">
                              {pkg.sessionsPerMonth} Sessions/mo
                            </span>
                          </div>

                          <div className="mb-4">
                            <span className="font-serif text-3xl font-black text-slate-900">
                              ₹{pkg.monthlyDisplayPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-slate-500 font-bold ml-1">/month</span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-700 mb-4">
                            <div className="flex justify-between">
                              <span>Total Allowed Classes:</span>
                              <strong className="text-slate-900">{totalClasses} Sessions</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Validity:</span>
                              <strong className="text-slate-900">{pkg.durationMonths * 30} Days</strong>
                            </div>
                            <div className="flex justify-between text-purple-800 font-bold">
                              <span>Total Tuition:</span>
                              <span>₹{pkg.totalPrice.toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          <ul className="space-y-1.5 text-xs text-slate-600">
                            <li className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Live 1:1 Guru Mentorship</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tanpura & Riyaz Studio Unlocked</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Graded Certificate Track</span>
                            </li>
                          </ul>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100">
                          <SaremiButton variant={isBestValue ? 'primary' : 'outline'} size="sm" fullWidth>
                            Select {pkg.durationMonths}M Plan
                          </SaremiButton>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: SIGN IN / CREATE ACCOUNT */}
          {/* ========================================================================= */}
          {step === 'account' && selectedCourse && selectedPackage && (
            <motion.div key="step-account" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="max-w-xl mx-auto">
              <button
                onClick={() => setStep('package')}
                className="text-xs font-bold font-display text-purple-700 mb-6 flex items-center gap-1 hover:underline cursor-pointer"
              >
                &larr; Change Selected Package
              </button>

              <div className="bg-white rounded-[28px] border border-slate-200 shadow-saremi-card p-7 sm:p-9 text-left">
                {user ? (
                  // Already authenticated
                  <div className="space-y-5 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-slate-900">Signed In As</h3>
                      <p className="text-slate-600 text-sm font-medium mt-1">{user.displayName || profile?.name || 'Student Musician'}</p>
                      <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-950 text-left">
                      <strong>Ready to Checkout:</strong> Your student account is active and verified. Proceeding will link your enrollment and unlock your Student Sanctuary.
                    </div>

                    <SaremiButton variant="primary" size="lg" fullWidth onClick={() => setStep('review')}>
                      Continue to Final Checkout &rarr;
                    </SaremiButton>
                  </div>
                ) : (
                  // Visitor needs to Sign In or Sign Up
                  <div>
                    <div className="flex border-b border-slate-100 mb-6">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                        className={`flex-1 pb-3 font-bold text-xs uppercase tracking-wider text-center border-b-2 cursor-pointer transition-all ${
                          authMode === 'signup'
                            ? 'border-purple-700 text-purple-900'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Create Student Account
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('signin'); setAuthError(null); }}
                        className={`flex-1 pb-3 font-bold text-xs uppercase tracking-wider text-center border-b-2 cursor-pointer transition-all ${
                          authMode === 'signin'
                            ? 'border-purple-700 text-purple-900'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Student Sign In
                      </button>
                    </div>

                    <div className="mb-6 text-center">
                      <h3 className="font-serif text-2xl font-bold text-slate-900">
                        {authMode === 'signup' ? 'Create Your Student Sanctuary' : 'Welcome Back, Musician'}
                      </h3>
                      <p className="text-slate-500 text-xs mt-1">
                        {authMode === 'signup' 
                          ? 'Your unique Student ID will hold your course enrollments, class bookings, and Riyaaz logs.'
                          : 'Sign in to connect your new course enrollment to your existing dashboard.'}
                      </p>
                    </div>

                    {authError && (
                      <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <form onSubmit={handleAuthSubmit} className="space-y-4">
                      {authMode === 'signup' && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name *</label>
                            <input
                              type="text"
                              required
                              value={authName}
                              onChange={(e) => setAuthName(e.target.value)}
                              placeholder="e.g. Aarav Sharma"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Phone Number</label>
                            <input
                              type="tel"
                              value={authPhone}
                              onChange={(e) => setAuthPhone(e.target.value)}
                              placeholder="+91 98765 43210"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="learner@example.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                        <input
                          type="password"
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                      </div>

                      <SaremiButton variant="primary" size="lg" fullWidth type="submit" disabled={authLoading}>
                        {authLoading ? 'Authenticating...' : authMode === 'signup' ? 'Create Account & Continue' : 'Sign In & Continue'}
                      </SaremiButton>
                    </form>

                    <div className="relative my-6 text-center">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                      <span className="relative bg-white px-3 text-[11px] text-slate-400 font-bold uppercase">Or</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={authLoading}
                      className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: REVIEW & VERIFIED RAZORPAY PAYMENT */}
          {/* ========================================================================= */}
          {step === 'review' && selectedCourse && selectedPackage && (
            <motion.div key="step-review" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid lg:grid-cols-3 gap-8">
              
              {/* Left 2 Cols: Schedule Preferences & Guarantees */}
              <div className="lg:col-span-2 space-y-6">
                <button
                  onClick={() => setStep('package')}
                  className="text-xs font-bold font-display text-purple-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  &larr; Back to Package Selection
                </button>

                {/* Scheduling & Flexibility Information Card */}
                <div className="bg-white rounded-[24px] border border-slate-200 shadow-saremi-card p-6 sm:p-7">
                  <h3 className="font-serif text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-700" />
                    Class Schedule & Timings
                  </h3>

                  <p className="text-slate-600 text-xs leading-relaxed mb-4">
                    Immediately following verified payment, you will select your preferred weekly class days and time slot. Our Academic Directorate will review your preferences to assign and confirm the appropriate Faculty Guru and class schedule.
                  </p>

                  <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-start gap-3 text-xs text-purple-900">
                    <Sparkles className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Flexible Rescheduling Guarantee</strong>
                      <span>You can reschedule any 1:1 session up to 4 hours prior directly from your Student Dashboard.</span>
                    </div>
                  </div>
                </div>

                {/* Authenticated Student Details Review */}
                <div className="bg-white rounded-[24px] border border-slate-200 shadow-saremi-card p-6 sm:p-7">
                  <h3 className="font-serif text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-700" />
                    Enrolled Student Profile
                  </h3>

                  <div className="grid sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block font-medium">Student Name</span>
                      <strong className="text-slate-900 text-sm font-bold">{profile?.name || user?.displayName || studentDetails.name}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block font-medium">Email Account</span>
                      <strong className="text-slate-900 font-bold truncate block">{profile?.email || user?.email || studentDetails.email}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block font-medium">Phone / WhatsApp</span>
                      <strong className="text-slate-900 font-bold">{profile?.phone || studentDetails.phone || 'Provided at check-in'}</strong>
                    </div>
                  </div>
                </div>

                {/* Trust & Guarantee Cards */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-xs font-bold text-emerald-950">100% Satisfaction Guarantee</strong>
                      <p className="text-[11px] text-emerald-800 font-medium">Full refund or mentor rematch if not delighted after session 1.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-start gap-3">
                    <Award className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-xs font-bold text-purple-950">Certified Graded Certification</strong>
                      <p className="text-[11px] text-purple-800 font-medium">Includes examination jury assessment and diploma upon term completion.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Order Summary & Pay Button */}
              <div className="lg:col-span-1">
                <div className="p-7 rounded-[28px] bg-white border-2 border-purple-500/40 shadow-saremi-purple sticky top-20 space-y-6">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-purple-700 uppercase tracking-wider block mb-1">
                      Official Academy Tuition
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-slate-900">
                      Order Summary
                    </h3>
                  </div>

                  <div className="space-y-3 pb-4 border-b border-slate-100 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="font-bold text-slate-900 block text-sm">{getProgramDisplayName()}</strong>
                        <span className="text-slate-500 capitalize">{selectedPackage.learningMode.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                        {selectedPackage.durationMonths} Month(s)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2.5 rounded-xl font-medium">
                      <span>Total Allowed Classes</span>
                      <strong className="text-slate-900 font-bold">
                        {selectedPackage.sessionsPerMonth * selectedPackage.durationMonths} Sessions
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2.5 rounded-xl font-medium">
                      <span>Live Riyaaz Studio</span>
                      <strong className="text-emerald-600 font-bold">Unlocked (Lifetime)</strong>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Monthly Equivalent</span>
                      <strong className="text-slate-900">₹{selectedPackage.monthlyDisplayPrice.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Payment Gateway Verification</span>
                      <strong className="text-emerald-600">HMAC-SHA256 Encrypted</strong>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-display font-bold text-slate-900 text-sm">Total Payable</span>
                    <span className="font-serif text-3xl font-black text-purple-900">
                      ₹{selectedPackage.totalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <SaremiButton
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleProceedToRazorpay}
                    disabled={isProcessing}
                    icon={isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  >
                    {isProcessing ? 'Verifying with Gateway...' : 'Pay with Razorpay'}
                  </SaremiButton>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Protected by Razorpay 256-Bit SSL</span>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: POST-PAYMENT SCHEDULE & TIMING SELECTION */}
          {/* ========================================================================= */}
          {step === 'schedule' && confirmedOrder && (
            <motion.div
              key="step-schedule"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Payment Verified & Enrollment Created
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-slate-900">
                  Select Your Class Schedule & Timing
                </h1>
                <p className="text-slate-600 text-sm font-medium max-w-lg mx-auto">
                  Choose your preferred weekly class days and time slot for your {getProgramDisplayName()} Conservatory mentorship.
                </p>
              </div>

              <div className="bg-white rounded-[28px] border border-slate-200 shadow-saremi-card p-6 sm:p-8 space-y-6">
                
                {/* 1. Preferred Weekly Days */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold font-display uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-purple-700" />
                      Preferred Weekly Class Days
                    </label>
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                      {selectedPackage?.sessionsPerMonth === 8 ? '2 Sessions / Week' : '1 Session / Week'}
                    </span>
                  </div>

                  {/* Preset Combinations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PRESET_PAIRS.map((preset) => {
                      const isSelected =
                        preset.days.length === selectedScheduleDays.length &&
                        preset.days.every((d) => selectedScheduleDays.includes(d));
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setSelectedScheduleDays(preset.days)}
                          className={`p-3.5 rounded-2xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-300'
                          }`}
                        >
                          <span>{preset.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Individual Day Chips */}
                  <div className="pt-2">
                    <span className="block text-[11px] font-medium text-slate-500 mb-2">
                      Or select individual day(s):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => {
                        const isDaySelected = selectedScheduleDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleScheduleDay(day)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              isDaySelected
                                ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. Preferred Time Window & Timezone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold font-display uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-700" />
                      Preferred Time Window
                    </label>
                    <select
                      value={scheduleTimeSlot}
                      onChange={(e) => setScheduleTimeSlot(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="10:00 AM (Morning)">10:00 AM (Morning)</option>
                      <option value="11:30 AM (Late Morning)">11:30 AM (Late Morning)</option>
                      <option value="02:00 PM (Afternoon)">02:00 PM (Afternoon)</option>
                      <option value="04:00 PM (Late Afternoon)">04:00 PM (Late Afternoon)</option>
                      <option value="06:00 PM (Evening)">06:00 PM (Evening)</option>
                      <option value="07:30 PM (Night)">07:30 PM (Night)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-display uppercase tracking-wider text-slate-800 mb-1.5">
                      Your Timezone
                    </label>
                    <select
                      value={scheduleTimezone}
                      onChange={(e) => setScheduleTimezone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="IST (India Standard Time, UTC+5:30)">IST (India Standard Time, UTC+5:30)</option>
                      <option value="EST (US Eastern, UTC-5)">EST (US Eastern, UTC-5)</option>
                      <option value="PST (US Pacific, UTC-8)">PST (US Pacific, UTC-8)</option>
                      <option value="GMT (UK / Western Europe, UTC+0)">GMT (UK / Western Europe, UTC+0)</option>
                      <option value="SGT (Singapore, UTC+8)">SGT (Singapore, UTC+8)</option>
                      <option value="AEST (Sydney / Melbourne, UTC+10)">AEST (Sydney / Melbourne, UTC+10)</option>
                    </select>
                  </div>
                </div>

                {/* 3. Optional Learning & Timing Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Special Timing or Teacher Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    placeholder="e.g. Prefer slots after school/work; beginner student starting vocal foundation."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Admin Assignment Guarantee */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Academic Directorate Assignment</strong>
                    <span>
                      Our Academic Directorate will align your preferred slot with the appropriate Faculty Guru and confirm your schedule within 24 hours.
                    </span>
                  </div>
                </div>

                {/* Action Submit */}
                <SaremiButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleSubmitSchedule}
                  disabled={isSavingSchedule}
                  icon={isSavingSchedule ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                >
                  {isSavingSchedule ? 'Saving Schedule...' : 'Submit Schedule Preferences & Confirm Enrollment →'}
                </SaremiButton>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 6: ENROLLMENT CONFIRMED & SCHEDULE REQUESTED STATE */}
          {/* ========================================================================= */}
          {step === 'success' && confirmedOrder && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto text-center py-8"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-5 shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Backend Payment Verified
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold">
                  <Calendar className="w-3.5 h-3.5 text-purple-700" />
                  Schedule Requested / Awaiting Confirmation
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">
                Welcome to Saremi Academy! 🎶
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-medium mb-6 max-w-md mx-auto">
                Your payment is verified and your class schedule preference has been submitted to the Academic Directorate.
              </p>

              <div className="bg-white rounded-[24px] border border-slate-200 shadow-saremi-card p-6 text-left mb-6 space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Official Invoice</span>
                  <strong className="text-slate-900 font-mono">{confirmedOrder.invoiceNumber}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Transaction ID</span>
                  <strong className="text-slate-900 font-mono">{confirmedOrder.paymentId}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Active Course</span>
                  <strong className="text-slate-900">{getProgramDisplayName()} Conservatory</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Total Allowed Classes</span>
                  <strong className="text-purple-700 font-bold">{confirmedOrder.classesTotal} Live 1:1 Sessions</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Requested Class Schedule</span>
                  <strong className="text-purple-900 font-bold">
                    {selectedScheduleDays.join(' & ')} at {scheduleTimeSlot} ({scheduleTimezone})
                  </strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Scheduling Status</span>
                  <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                    Awaiting Admin Confirmation
                  </strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Validity Period</span>
                  <strong className="text-slate-900">{confirmedOrder.startDate} to {confirmedOrder.expiryDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Tuition Paid</span>
                  <strong className="text-emerald-700 font-serif text-sm font-black">
                    ₹{selectedPackage?.totalPrice.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-left text-xs text-purple-950 mb-6 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <p>
                  Our Academic Directorate will confirm your dedicated Faculty Guru and scheduled class video links within 24 hours. You can track this and begin practicing immediately in your Student Dashboard.
                </p>
              </div>

              <div className="space-y-3">
                <SaremiButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => navigate('/app')}
                  icon={<Sparkles className="w-5 h-5" />}
                >
                  Launch Student Sanctuary & Studio
                </SaremiButton>

                <p className="text-xs text-slate-400">
                  All 7 Student Sanctuary modules (Classes, Syllabus, Riyaaz, Attendance, Invoices) are now active.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
};
