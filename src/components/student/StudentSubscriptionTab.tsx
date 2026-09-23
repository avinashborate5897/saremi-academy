import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Receipt,
  FileText,
  AlertTriangle,
  Lock,
  Flame,
  Layers
} from 'lucide-react';
import { UserProfile, EnrollmentRecord, StudentSubscriptionStatus } from '../../types';
import { getAuthoritativePackage } from '../../data/pricingData';
import { CourseEnrollmentModal } from '../checkout/CourseEnrollmentModal';
import { calculateSubscriptionStatus } from '../../lib/academyWorkflowService';

interface StudentSubscriptionTabProps {
  profile: UserProfile | null;
  enrollments?: EnrollmentRecord[];
  subscriptionOverride?: 'active' | 'expired' | 'exhausted' | null;
  onSetSubscriptionOverride?: (override: 'active' | 'expired' | 'exhausted' | null) => void;
}

export const StudentSubscriptionTab: React.FC<StudentSubscriptionTabProps> = ({ 
  profile,
  enrollments = [],
  subscriptionOverride,
  onSetSubscriptionOverride
}) => {
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);

  // Compute calculated subscription status from real database/profile state
  const computedStatus = calculateSubscriptionStatus(profile, enrollments);

  // Apply optional simulation override if selected
  const activeStatus: StudentSubscriptionStatus = React.useMemo(() => {
    if (!subscriptionOverride) return computedStatus;
    if (subscriptionOverride === 'expired') {
      const pastExp = new Date(Date.now() - 5 * 86400000).toISOString();
      return {
        ...computedStatus,
        hasActiveSubscription: false,
        accessGranted: false,
        isExpired: true,
        status: 'expired',
        expiryDate: pastExp,
        daysUntilExpiry: 0,
        lockReason: 'package_expired',
        message: 'Your package has expired. Renew your plan to continue learning.'
      };
    }
    if (subscriptionOverride === 'exhausted') {
      return {
        ...computedStatus,
        hasActiveSubscription: false,
        accessGranted: false,
        isExhausted: true,
        isExpired: true,
        status: 'exhausted',
        usedSessions: computedStatus.totalSessions,
        remainingSessions: 0,
        classesRemaining: 0,
        lockReason: 'sessions_exhausted',
        message: 'Your package has expired. Renew your plan to continue learning.'
      };
    }
    return {
      ...computedStatus,
      hasActiveSubscription: true,
      accessGranted: true,
      isExpired: false,
      isExhausted: false,
      status: 'active',
      lockReason: null
    };
  }, [computedStatus, subscriptionOverride]);

  const formatDate = (dateStr?: string, fallback: string = 'N/A') => {
    if (!dateStr) return fallback;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? fallback : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const canonicalPkg = getAuthoritativePackage(activeStatus?.packageDetails?.packageId || 'pkg-std-1-1-8s-3m');
  const baseTuitionAmount = (activeStatus as any)?.amountPaid || canonicalPkg?.totalPrice || 11997;
  const gstTuitionAmount = Math.round(baseTuitionAmount * 0.18);
  const totalTuitionPaid = baseTuitionAmount + gstTuitionAmount;

  const packageInfo = {
    name: activeStatus?.packageDetails?.packageName || canonicalPkg?.name || '3-Month Level Certification Term (24 Classes)',
    courseTitle: activeStatus?.packageDetails?.courseTitle || 'Hindustani Classical Vocal Conservatory',
    format: activeStatus?.packageDetails?.format || '1:1 Private Mentorship with Faculty Master',
    mentorName: activeStatus?.packageDetails?.teacherName || (profile as any)?.assignedTeacher || 'Assigned Faculty Guru',
    purchaseDate: formatDate(activeStatus?.purchaseDate, 'Oct 1, 2026'),
    startDate: formatDate(activeStatus?.startDate, 'Oct 1, 2026'),
    expiryDate: formatDate(activeStatus?.expiryDate, 'Jan 1, 2027'),
    packageDuration: activeStatus?.packageDuration || `${canonicalPkg?.durationMonths || 3} Months`,
    totalSessions: activeStatus?.totalSessions ?? (canonicalPkg?.totalClasses || 24),
    usedSessions: activeStatus?.usedSessions ?? 0,
    remainingSessions: activeStatus?.remainingSessions ?? (canonicalPkg?.totalClasses || 24),
    status: activeStatus?.status || 'active',
    amount: `₹${baseTuitionAmount.toLocaleString('en-IN')}`,
    gstAmount: `₹${gstTuitionAmount.toLocaleString('en-IN')}`,
    totalPaid: `₹${totalTuitionPaid.toLocaleString('en-IN')}`,
    paymentMethod: 'Razorpay UPI / Net Banking',
    transactionId: 'pay_SAR9823419082',
    invoiceNumber: 'INV-SAR-2026-0891'
  };

  const invoiceHistory = [
    {
      invoiceId: 'INV-SAR-2026-0891',
      date: packageInfo.purchaseDate,
      description: packageInfo.name,
      amount: packageInfo.totalPaid,
      status: 'Paid & Verified',
      method: 'Razorpay Gateway'
    }
  ];

  const handleDownloadInvoice = (invId: string) => {
    const text = `=========================================
SAREMI MUSIC ACADEMY - TAX INVOICE
=========================================
Invoice Number: ${invId}
Purchase Date: ${packageInfo.purchaseDate}
Start Date: ${packageInfo.startDate}
Expiry Date: ${packageInfo.expiryDate}
Package Duration: ${packageInfo.packageDuration}
Total Sessions: ${packageInfo.totalSessions}
Used Sessions: ${packageInfo.usedSessions}
Remaining Sessions: ${packageInfo.remainingSessions}
Subscription Status: ${packageInfo.status.toUpperCase()}
Student Name: ${profile?.name || 'Student'}
Student Email: ${profile?.email}
Course: ${packageInfo.courseTitle}
Plan: ${packageInfo.name}
Base Amount: ${packageInfo.amount}
18% GST: ${packageInfo.gstAmount}
Total Paid: ${packageInfo.totalPaid}
Payment Gateway: ${packageInfo.paymentMethod}
Transaction Reference: ${packageInfo.transactionId}
=========================================
Thank you for learning with Saremi Conservatory.`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `${invId}.txt`);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header & Renew Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-1">
            <CreditCard className="w-3.5 h-3.5 text-amber-700" />
            Tuition & Package Management
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">Payments & Subscription</h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            Package validity, session balances, status controls, and official GST tax receipts.
          </p>
        </div>

        <button
          onClick={() => setIsRenewalModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer self-start sm:self-auto hover:shadow-lg"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Renew Package</span>
        </button>
      </div>

      {/* Package Expiration Warning Banner if Expired */}
      {(!activeStatus.accessGranted || activeStatus.isExpired) && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-200 text-rose-800">
                Package Status: {activeStatus.status.toUpperCase()}
              </div>
              <h3 className="font-serif text-xl font-bold text-rose-950">
                Your package has expired. Renew your plan to continue learning.
              </h3>
              <p className="text-xs text-rose-800 leading-relaxed max-w-2xl">
                Live 1:1 classroom entry, course curriculum modules, and Tanpura practice studio are locked. Your completed class history, mentor notes, and attendance records remain preserved.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsRenewalModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Renew Package</span>
          </button>
        </div>
      )}

      {/* 8 Mandatory Package Data Attributes Card */}
      <div className="bg-[#121829] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  activeStatus.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  Status: {packageInfo.status.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-gray-400">Ref: {packageInfo.transactionId}</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-white">{packageInfo.name}</h3>
              <p className="text-xs text-amber-200 mt-0.5 font-medium">{packageInfo.format} • Mentor: {packageInfo.mentorName}</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-gray-400 block">Tuition Paid</span>
              <span className="font-serif text-2xl sm:text-3xl font-black text-amber-400">
                {packageInfo.totalPaid}
              </span>
            </div>
          </div>

          {/* 8 Explicit Package Properties Display */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* 1. Purchase Date */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                Purchase Date
              </span>
              <span className="font-bold text-sm text-white">{packageInfo.purchaseDate}</span>
            </div>

            {/* 2. Start Date */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-400" />
                Start Date
              </span>
              <span className="font-bold text-sm text-white">{packageInfo.startDate}</span>
            </div>

            {/* 3. Expiry Date */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 flex items-center gap-1">
                <AlertTriangle className={`w-3 h-3 ${activeStatus.isExpired ? 'text-rose-400' : 'text-amber-400'}`} />
                Expiry Date
              </span>
              <span className={`font-bold text-sm ${activeStatus.isExpired ? 'text-rose-400' : 'text-white'}`}>
                {packageInfo.expiryDate}
              </span>
            </div>

            {/* 4. Package Duration */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-purple-400" />
                Package Duration
              </span>
              <span className="font-bold text-sm text-amber-300">{packageInfo.packageDuration}</span>
            </div>

            {/* 5. Total Sessions */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                Total Sessions
              </span>
              <span className="font-bold text-sm text-white">{packageInfo.totalSessions} Classes</span>
            </div>

            {/* 6. Used Sessions */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                Used Sessions
              </span>
              <span className="font-bold text-sm text-emerald-400">{packageInfo.usedSessions} Completed</span>
            </div>

            {/* 7. Remaining Sessions */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                Remaining Sessions
              </span>
              <span className={`font-bold text-sm ${packageInfo.remainingSessions === 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                {packageInfo.remainingSessions} Classes
              </span>
            </div>

            {/* 8. Status */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                Status
              </span>
              <span className={`font-bold text-sm uppercase ${
                activeStatus.status === 'active' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {packageInfo.status}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified & Protected via Saremi Backend Authentication
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsRenewalModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-gray-950 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Renew Package</span>
              </button>

              <button
                onClick={() => handleDownloadInvoice(packageInfo.invoiceNumber)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>Download Tax Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Package State Tester/Simulator (Interactive Testing Tool) */}
      {onSetSubscriptionOverride && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 text-left space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Package Access Control Tester
            </h4>
            <span className="text-[11px] text-amber-700">Test live locking & UI transitions</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => onSetSubscriptionOverride(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !subscriptionOverride
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Default (Real Database Status)
            </button>
            <button
              onClick={() => onSetSubscriptionOverride('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subscriptionOverride === 'active'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              Simulate: Active Package (Full Access)
            </button>
            <button
              onClick={() => onSetSubscriptionOverride('expired')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subscriptionOverride === 'expired'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'bg-white text-rose-900 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              Simulate: Expired Date (Lock Access)
            </button>
            <button
              onClick={() => onSetSubscriptionOverride('exhausted')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subscriptionOverride === 'exhausted'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-white text-purple-900 border border-purple-200 hover:bg-purple-50'
              }`}
            >
              Simulate: Sessions Exhausted (0 Remaining)
            </button>
          </div>
        </div>
      )}

      {/* Preserved Invoice & Transaction History (Never deleted after expiry) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              Preserved Invoices & Payment Ledger
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Historical transactions and receipts remain permanently accessible regardless of plan expiration.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {invoiceHistory.length} Verified Invoice
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {invoiceHistory.map((inv) => (
            <div key={inv.invoiceId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-gray-900">{inv.invoiceId}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    {inv.status}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-900">{inv.description}</h4>
                <p className="text-xs text-gray-500">Paid on {inv.date} via {inv.method}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-serif font-bold text-base text-gray-900">{inv.amount}</span>
                <button
                  onClick={() => handleDownloadInvoice(inv.invoiceId)}
                  className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                  title="Download Tax Invoice"
                >
                  <Download className="w-4 h-4 text-amber-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Renewal Modal */}
      {isRenewalModalOpen && (
        <CourseEnrollmentModal
          isOpen={isRenewalModalOpen}
          isRenewal={true}
          existingEnrollment={profile?.enrolledCourses?.[0]}
          onClose={() => setIsRenewalModalOpen(false)}
          onSuccess={() => {
            setIsRenewalModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

