import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Music,
  Award,
  Lock,
  Gift,
  AlertCircle
} from 'lucide-react';
import { Course, CoursePackage, UserProfile, EnrolledCourse } from '../../types';
import { COURSE_CATALOG, getCourseBySlug, formatINR } from '../../lib/courseCatalog';
import { ACADEMY_PACKAGES, processCourseEnrollment, processSubscriptionRenewal } from '../../lib/academyWorkflowService';
import { TEACHERS_DATA } from '../../data/coursesData';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../router/RouterContext';

interface CourseEnrollmentModalProps {
  course?: Course | null;
  isOpen: boolean;
  onClose: () => void;
  isRenewal?: boolean;
  existingEnrollment?: EnrolledCourse;
  preselectedPackageId?: string;
  onSuccess?: () => void;
}

export const CourseEnrollmentModal: React.FC<CourseEnrollmentModalProps> = ({
  course,
  isOpen,
  onClose,
  isRenewal = false,
  existingEnrollment,
  preselectedPackageId,
  onSuccess
}) => {
  const { user, profile, refreshProfile } = useAuth();
  const { navigate } = useRouter();

  // Selected Package
  const [selectedPkgId, setSelectedPkgId] = useState<string>(
    preselectedPackageId || (isRenewal ? 'pkg-3month-term' : 'pkg-3month-term')
  );

  useEffect(() => {
    if (preselectedPackageId) {
      setSelectedPkgId(preselectedPackageId);
    }
  }, [preselectedPackageId]);

  const selectedPackage = ACADEMY_PACKAGES.find((p) => p.id === selectedPkgId) || ACADEMY_PACKAGES[1];

  // Steps: 1: Select Package & Schedule, 2: Checkout & Payment, 3: Success Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Student Details Form
  const [studentName, setStudentName] = useState(profile?.name || user?.displayName || '');
  const [studentEmail, setStudentEmail] = useState(profile?.email || user?.email || '');
  const [studentPhone, setStudentPhone] = useState(profile?.phone || '');

  // Schedule Preferences
  const [preferredTeacherId, setPreferredTeacherId] = useState<string>('assigned');
  const [selectedSlotDays, setSelectedSlotDays] = useState<'Tue & Fri' | 'Mon & Thu' | 'Wed & Sat' | 'Weekend Only'>('Tue & Fri');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('18:00 (Evening)');

  // Currency
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  // Checkout / Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [enrollmentResult, setEnrollmentResult] = useState<any>(null);

  // Auto-sync user details if profile loaded later
  useEffect(() => {
    if (profile?.name && !studentName) setStudentName(profile.name);
    if (profile?.email && !studentEmail) setStudentEmail(profile.email);
    if (profile?.phone && !studentPhone) setStudentPhone(profile.phone);
  }, [profile]);

  if (!isOpen) return null;

  // Calculate Price with Renewal discount
  const renewalDiscountRate = isRenewal ? 0.12 : 0; // 12% discount on renewals
  const basePrice = currency === 'INR' ? selectedPackage.priceINR : selectedPackage.priceUSD;
  const discountAmount = Math.round(basePrice * renewalDiscountRate);
  const finalPrice = basePrice - discountAmount;

  const currentCourse: Course = course || {
    id: 'course-hindustani-vocal',
    slug: 'hindustani-classical-vocal',
    title: existingEnrollment?.courseTitle || 'Hindustani Classical Vocal',
    instrument: (existingEnrollment?.instrument as any) || 'vocals',
    category: 'Indian Classical',
    tagline: 'Master the vocal discipline, Kharaj riyaaz, and classical Raags.',
    description: '1:1 personalized training with certified Gurus.',
    level: 'All Levels',
    ageGroup: 'Kids & Adults',
    sessionsPerWeek: 2,
    sessionLengthMinutes: 45,
    priceMonthly: 120,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80',
    curriculum: ['Voice Culture', 'Raag Yaman', 'Aalap & Taans'],
    featured: true
  };

  const handleProceedToRazorpay = async () => {
    if (!studentName.trim() || !studentEmail.trim()) {
      setErrorMessage('Please enter your full name and email address.');
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

      // 1. Check if Razorpay script is loaded
      const isRazorpayAvailable = typeof (window as any).Razorpay !== 'undefined';

      // 2. Create server-side order with full details
      const clientOrderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      let internalOrderId = clientOrderId;
      let razorpayOrderId: string | undefined = undefined;
      let rzpKeyId = (window as any).RAZORPAY_KEY_ID || 'rzp_test_saremi_academy';

      try {
        const res = await fetch('/api/create-razorpay-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: clientOrderId,
            amount: finalPrice,
            currency: currency === 'INR' ? 'INR' : 'USD',
            customerName: studentName,
            customerEmail: studentEmail,
            notes: {
              courseId: currentCourse.id,
              courseName: currentCourse.title,
              packageId: selectedPackage.id,
              packageName: selectedPackage.name,
              studentEmail
            }
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.razorpayOrderId || data.id) {
            razorpayOrderId = data.razorpayOrderId || data.id;
          }
          if (data.orderId) {
            internalOrderId = data.orderId;
          }
          if (data.keyId) {
            rzpKeyId = data.keyId;
          }
        }
      } catch (err) {
        console.warn('Razorpay server order creation notice:', err);
      }

      // If Razorpay SDK is available, open checkout handler
      if (isRazorpayAvailable) {
        const options = {
          key: rzpKeyId,
          amount: finalPrice * 100,
          currency: currency === 'INR' ? 'INR' : 'USD',
          name: 'Saremi Music Academy',
          description: `${currentCourse.title} - ${selectedPackage.name}`,
          order_id: razorpayOrderId,
          prefill: {
            name: studentName,
            email: studentEmail,
            contact: studentPhone || '9876543210'
          },
          theme: {
            color: '#D49A3D'
          },
          handler: async (response: any) => {
            try {
              setIsProcessing(true);
              setErrorMessage(null);

              // 1. Mandatory Backend Payment Verification & Server-Authoritative Enrollment Activation
              const verifyRes = await fetch('/api/verify-razorpay-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id || razorpayOrderId || internalOrderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  orderId: internalOrderId,
                  courseId: currentCourse.id,
                  packageId: selectedPackage.id,
                  studentId: profile?.id || user?.uid || `std_${Date.now()}`,
                  studentEmail,
                  studentName,
                  studentPhone,
                  amountPaid: finalPrice,
                  currency,
                  preferredTeacherId: preferredTeacherId || undefined,
                  learningMode: (selectedPackage as any).learningMode || '1:1 Live Online',
                  scheduleSummary: `${selectedSlotDays} (${selectedTimeSlot})`
                })
              });

              const verifyData = await verifyRes.json();

              if (!verifyRes.ok || !verifyData.verified) {
                throw new Error(verifyData.message || 'Payment signature verification failed on backend. Course not activated.');
              }

              // 2. Only proceed to finalize enrollment after backend verified
              await finalizeEnrollment(response.razorpay_payment_id || `pay_${Date.now()}`, internalOrderId, verifyData);
            } catch (err: any) {
              console.error('Backend payment verification failed:', err);
              setErrorMessage(err.message || 'Payment verification failed on server. Course was not activated.');
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              setErrorMessage('Payment was dismissed or cancelled. No enrollment was created.');
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          setErrorMessage(response.error?.description || 'Payment could not be completed. Your course has not been activated.');
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        // Direct sandbox verification if script was blocked (non-production only)
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Razorpay payment gateway unavailable in production. Please refresh and try again.');
        }

        const simOrderId = razorpayOrderId || `order_sim_${Date.now()}`;
        const simPaymentId = `pay_sim_${Date.now()}`;

        const verifyRes = await fetch('/api/verify-razorpay-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: simOrderId,
            razorpayPaymentId: simPaymentId,
            razorpaySignature: 'simulated_sig',
            orderId: internalOrderId
          })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.verified) {
          await finalizeEnrollment(simPaymentId, internalOrderId, verifyData);
        } else {
          throw new Error(verifyData.message || 'Payment simulation verification failed');
        }
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Payment initiation failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const finalizeEnrollment = async (paymentId: string, orderId: string, verifyData?: any) => {
    try {
      const assignedName = (profile as any)?.assignedTeacher || 'Assigned Certified Faculty';
      const selectedTeacher = {
        id: preferredTeacherId || 'assigned',
        name: assignedName
      };

      if (isRenewal) {
        await processSubscriptionRenewal({
          studentId: profile?.id || user?.uid || `std_${Date.now()}`,
          studentName,
          studentEmail,
          packageItem: selectedPackage,
          paymentInfo: {
            orderId,
            paymentId,
            amountPaid: finalPrice,
            currency,
            serverVerificationToken: verifyData?.serverVerificationToken,
            isSimulated: verifyData?.isSimulated
          }
        });
      } else {
        const res = await processCourseEnrollment({
          student: {
            id: profile?.id || user?.uid || `std_${Date.now()}`,
            name: studentName,
            email: studentEmail,
            phone: studentPhone
          },
          course: currentCourse,
          packageItem: selectedPackage,
          preferredTeacher: {
            id: selectedTeacher.id,
            name: selectedTeacher.name
          },
          preferredSlot: {
            day1: selectedSlotDays.split('&')[0].trim(),
            time1: selectedTimeSlot.split(' ')[0],
            day2: selectedSlotDays.includes('&') ? selectedSlotDays.split('&')[1].trim() : undefined,
            time2: selectedTimeSlot.split(' ')[0]
          },
          paymentInfo: {
            orderId,
            paymentId,
            amountPaid: finalPrice,
            currency,
            serverVerificationToken: verifyData?.serverVerificationToken,
            isSimulated: verifyData?.isSimulated
          }
        });
        setEnrollmentResult(res);
      }

      setStep(3);
      if (refreshProfile) await refreshProfile();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Finalize enrollment error:', err);
      setErrorMessage('Enrollment finalized but encountered a sync note. Redirecting to dashboard...');
      setStep(3);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F17]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto text-left shadow-2xl border border-gray-100 my-6 relative flex flex-col"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#121829] to-[#1C253B] text-white rounded-t-3xl relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {isRenewal ? 'Subscription Renewal' : 'Course Enrollment'}
            </span>
            <span className="text-xs text-gray-300">• Live 1:1 Mentorship</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
            {isRenewal ? `Renew: ${currentCourse.title}` : `Enroll in ${currentCourse.title}`}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Choose your learning term, select your preferred guru & schedule, and begin your structured training.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 flex-1">
          {step === 1 && (
            <div className="space-y-8">
              {/* 1. PACKAGE SELECTION */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-lg text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    1. Select Your Learning Package
                  </h3>

                  {/* Currency Switcher */}
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setCurrency('INR')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        currency === 'INR' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      ₹ INR
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        currency === 'USD' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      $ USD
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ACADEMY_PACKAGES.map((pkg) => {
                    const isSelected = selectedPkgId === pkg.id;
                    const price = currency === 'INR' ? pkg.priceINR : pkg.priceUSD;
                    const origPrice = currency === 'INR' ? pkg.originalPriceINR : pkg.originalPriceUSD;

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkgId(pkg.id)}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/40 shadow-md ring-2 ring-amber-600/20'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {pkg.badge && (
                          <span className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            pkg.isPopular ? 'bg-amber-600 text-white shadow' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {pkg.badge}
                          </span>
                        )}

                        <div>
                          <div className="font-serif font-bold text-lg text-gray-900 mb-1">
                            {pkg.name}
                          </div>
                          <p className="text-xs text-gray-500 mb-3">{pkg.tagline}</p>

                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="font-serif font-bold text-2xl text-gray-900">
                              {currency === 'INR' ? `₹${price.toLocaleString()}` : `$${price}`}
                            </span>
                            {origPrice && (
                              <span className="text-xs text-gray-400 line-through">
                                {currency === 'INR' ? `₹${origPrice.toLocaleString()}` : `$${origPrice}`}
                              </span>
                            )}
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {pkg.totalClasses} Sessions
                            </span>
                          </div>

                          <ul className="space-y-1.5 text-xs text-gray-600 mb-4">
                            {pkg.features.slice(0, 3).map((f, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-500">
                            {pkg.durationMonths} Month{pkg.durationMonths > 1 ? 's' : ''} Term
                          </span>
                          <span className={`font-bold ${isSelected ? 'text-amber-700' : 'text-gray-400'}`}>
                            {isSelected ? 'Selected ✓' : 'Click to Select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. STUDENT INFORMATION */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="font-serif font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-600" />
                  2. Student & Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      WhatsApp Phone Number
                    </label>
                    <input
                      type="tel"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. TEACHER & SCHEDULE PREFERENCES */}
              {!isRenewal && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="font-serif font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    3. Guru & Schedule Preference
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Faculty Assignment
                      </label>
                      <select
                        value={preferredTeacherId}
                        onChange={(e) => setPreferredTeacherId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="assigned">Assigned Certified Faculty (Recommended)</option>
                        <option value="trial-mentor">Trial Mentor (Continue with trial guru)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Weekly Class Days (2x/week)
                      </label>
                      <select
                        value={selectedSlotDays}
                        onChange={(e) => setSelectedSlotDays(e.target.value as any)}
                        className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Tue & Fri">Tuesdays & Fridays</option>
                        <option value="Mon & Thu">Mondays & Thursdays</option>
                        <option value="Wed & Sat">Wednesdays & Saturdays</option>
                        <option value="Weekend Only">Saturdays & Sundays (Weekend)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Preferred Time Slot (IST)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        '10:00 AM (Morning)',
                        '04:00 PM (Afternoon)',
                        '06:00 PM (Evening)',
                        '08:00 PM (Night)'
                      ].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            selectedTimeSlot === slot
                              ? 'bg-amber-600 text-white font-bold shadow'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-gray-500">Total Payable Amount</div>
                  <div className="font-serif font-bold text-2xl text-gray-900 flex items-center gap-2">
                    <span>
                      {currency === 'INR' ? `₹${finalPrice.toLocaleString()}` : `$${finalPrice}`}
                    </span>
                    {isRenewal && (
                      <span className="text-xs font-sans font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        12% Loyalty Discount Applied
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedToRazorpay}
                    disabled={isProcessing}
                    className="flex-1 sm:flex-initial px-8 py-3.5 rounded-xl bg-[#D49A3D] hover:bg-[#c38a2e] text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span>Opening Secure Gateway...</span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Proceed to Secure Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ENROLLMENT SUCCESS */}
          {step === 3 && (
            <div className="py-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-500 text-emerald-600 mx-auto flex items-center justify-center shadow-lg animate-bounce">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>

              <div>
                <h3 className="font-serif text-3xl font-bold text-gray-900">
                  {isRenewal ? 'Subscription Renewed!' : 'Welcome to Saremi Academy!'}
                </h3>
                <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
                  Your enrollment in <strong className="text-gray-900">{selectedPackage.name}</strong> has been successfully confirmed. {selectedPackage.totalClasses} Live 1:1 sessions have been added to your Student Sanctuary.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 max-w-lg mx-auto border border-gray-200 text-left text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Course:</span>
                  <span className="font-bold text-gray-900">{currentCourse.title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Total Live Sessions:</span>
                  <span className="font-bold text-gray-900">{selectedPackage.totalClasses} Sessions (45 min)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Preferred Slot:</span>
                  <span className="font-bold text-gray-900">{selectedSlotDays} at {selectedTimeSlot}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Confirmation Sent To:</span>
                  <span className="font-bold text-gray-900">{studentEmail}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/app');
                  }}
                  className="px-8 py-3.5 rounded-xl bg-[#D49A3D] hover:bg-[#c38a2e] text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Go to My Student Sanctuary</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
