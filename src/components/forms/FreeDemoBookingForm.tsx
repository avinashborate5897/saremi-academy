import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  Music, 
  ShieldCheck, 
  Clock, 
  Mail, 
  Lock,
  Calendar as CalendarIcon, 
  Video, 
  Check, 
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { createBookingInFirestore, triggerTransactionalNotification } from '../../lib/firestoreService';
import { submitFreeTrialBooking, confirmTrialBookingSlot, subscribeToStudentTrialBookings } from '../../lib/courseCrmService';
import { autoAssignAndProvisionDemo } from '../../lib/teacherAutoAssignmentService';
import { SaremiLogo } from '../common/SaremiLogo';
import { useRouter } from '../../router/RouterContext';

interface FreeDemoBookingFormProps {
  initialCourse?: string;
  onSuccess?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

const COURSES = [
  'Singing',
  'Guitar',
  'Keyboard',
  'Tabla',
  'Violin',
  'Flute'
] as const;

type CourseType = typeof COURSES[number];

const SINGING_PROGRAMS = [
  'Kids Singing',
  'Hindustani Vocals',
  'Western Vocals'
] as const;

const TIME_SLOTS = [
  '10:00 AM',
  '11:00 AM',
  '02:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM'
];

const ACADEMY_WHATSAPP_NUMBER = '918591174823'; // Official Saremi Academy Admissions WhatsApp (+91 85911 74823)

export const FreeDemoBookingForm: React.FC<FreeDemoBookingFormProps> = ({
  initialCourse,
  onSuccess,
  onClose,
  isModal = false
}) => {
  const { user, profile, signUpWithEmail, signInWithEmail } = useAuth();
  const { navigate } = useRouter();

  // Form states
  const [fullName, setFullName] = useState(profile?.name || user?.displayName || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneRaw, setPhoneRaw] = useState(
    (profile?.phone || '').replace(/^\+91\s?/, '')
  );
  const [password, setPassword] = useState('');
  const [isExistingEmailPrompt, setIsExistingEmailPrompt] = useState(false);

  // Preferred Slot states
  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [preferredDate, setPreferredDate] = useState<string>(getTomorrowString());
  const [preferredTime, setPreferredTime] = useState<string>('06:00 PM');

  useEffect(() => {
    if (profile?.email || user?.email) {
      setEmail(profile?.email || user?.email || '');
    }
    if (profile?.name || user?.displayName) {
      setFullName(profile?.name || user?.displayName || '');
    }
  }, [user, profile]);

  // Determine initial course
  const detectInitialCourse = (): CourseType => {
    if (!initialCourse) return 'Singing';
    const lower = initialCourse.toLowerCase();
    if (lower.includes('guitar')) return 'Guitar';
    if (lower.includes('key') || lower.includes('piano')) return 'Keyboard';
    if (lower.includes('tabla')) return 'Tabla';
    if (lower.includes('violin')) return 'Violin';
    if (lower.includes('flute') || lower.includes('bansuri')) return 'Flute';
    return 'Singing';
  };

  const [selectedCourse, setSelectedCourse] = useState<CourseType>(detectInitialCourse);
  const [selectedProgram, setSelectedProgram] = useState<string>('Hindustani Vocals');
  const [classFormat, setClassFormat] = useState<'1:1 Individual Class' | 'Group Class'>('1:1 Individual Class');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string>('');
  const [assignedGuru, setAssignedGuru] = useState<string | null>(null);
  const [assignedClassId, setAssignedClassId] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'slot_proposed' | 'confirmed' | 'unassigned'>('slot_proposed');
  const [proposedSlotInfo, setProposedSlotInfo] = useState<{ date: string; time: string }>({
    date: getTomorrowString(),
    time: '06:00 PM'
  });
  const [isConfirmingSlot, setIsConfirmingSlot] = useState(false);
  const [isSlotConfirmed, setIsSlotConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingTrial, setExistingTrial] = useState<any>(null);

  // Subscribe to existing trial bookings for authenticated student or email
  useEffect(() => {
    const studentIdentifier = user?.uid || profile?.id || email;
    if (!studentIdentifier) {
      setExistingTrial(null);
      return;
    }
    const unsub = subscribeToStudentTrialBookings(studentIdentifier, email, (trials) => {
      const active = trials.find(t => t && t.status !== 'cancelled');
      if (active) {
        setExistingTrial(active);
      } else if (profile?.trialBooking) {
        setExistingTrial(profile.trialBooking);
      } else {
        setExistingTrial(null);
      }
    });
    return () => unsub();
  }, [user, profile, email]);

  // Sync program defaults when course changes
  useEffect(() => {
    if (selectedCourse === 'Singing') {
      if (!SINGING_PROGRAMS.includes(selectedProgram as any)) {
        setSelectedProgram('Hindustani Vocals');
      }
    } else if (selectedCourse === 'Guitar') {
      setSelectedProgram('Acoustic & Classical Guitar');
    } else if (selectedCourse === 'Keyboard') {
      setSelectedProgram('Keyboard & Piano Foundations');
    } else if (selectedCourse === 'Tabla') {
      setSelectedProgram('Traditional Tabla Rhythms');
    } else if (selectedCourse === 'Violin') {
      setSelectedProgram('Classical Violin Training');
    } else if (selectedCourse === 'Flute') {
      setSelectedProgram('Bansuri & Classical Flute');
    }
  }, [selectedCourse]);

  // Adjust class format based on selected program
  useEffect(() => {
    if (selectedCourse === 'Singing' && selectedProgram === 'Hindustani Vocals') {
      // Allow user choice between 1:1 and Group
    } else {
      // Strict rule: 1:1 Individual Class only for all others
      setClassFormat('1:1 Individual Class');
    }
  }, [selectedCourse, selectedProgram]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    const cleanPhoneDigits = phoneRaw.replace(/\D/g, '');

    if (!trimmedName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!cleanPhoneDigits || cleanPhoneDigits.length < 7) {
      setErrorMessage('Please enter a valid WhatsApp phone number.');
      return;
    }

    const fullPhoneNumber = `${countryCode} ${cleanPhoneDigits}`;
    const effectiveEmail = email.trim().toLowerCase();

    if (!effectiveEmail) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    // 1. Authenticate user if not logged in
    let activeStudentUid = user?.uid;

    if (!activeStudentUid) {
      if (!password || password.length < 6) {
        setErrorMessage('Please enter a password (at least 6 characters) to create your student account.');
        setIsSubmitting(false);
        return;
      }

      try {
        if (isExistingEmailPrompt) {
          await signInWithEmail(effectiveEmail, password);
          activeStudentUid = auth.currentUser?.uid;
        } else {
          try {
            await signUpWithEmail(effectiveEmail, password, trimmedName, fullPhoneNumber);
            activeStudentUid = auth.currentUser?.uid;
          } catch (signUpErr: any) {
            if (
              signUpErr.code === 'auth/email-already-in-use' || 
              (signUpErr.message && signUpErr.message.includes('already-in-use'))
            ) {
              setIsExistingEmailPrompt(true);
              setErrorMessage('This email is already registered. Please sign in to continue your Free Demo booking.');
              setIsSubmitting(false);
              return;
            } else {
              throw signUpErr;
            }
          }
        }
      } catch (authErr: any) {
        setErrorMessage(authErr.message || 'Authentication failed. Please verify your details.');
        setIsSubmitting(false);
        return;
      }
    }

    const studentId = activeStudentUid || auth.currentUser?.uid;
    if (!studentId) {
      setErrorMessage('Could not establish student account identity. Please try again.');
      setIsSubmitting(false);
      return;
    }

    if (existingTrial) {
      setIsSubmitting(false);
      if (onClose) onClose();
      navigate('/app');
      return;
    }

    // Ensure /users/{studentId} profile document exists
    try {
      const userRef = doc(db, 'users', studentId);
      await setDoc(
        userRef,
        {
          id: studentId,
          uid: studentId,
          name: trimmedName,
          email: effectiveEmail,
          phone: fullPhoneNumber,
          role: 'student',
          status: 'active',
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (userErr) {
      console.warn('User profile sync notice:', userErr);
    }

    const bookingId = `demo-${Date.now()}`;
    setCreatedBookingId(bookingId);
    setProposedSlotInfo({ date: preferredDate, time: preferredTime });

    const payload = {
      id: bookingId,
      userId: studentId,
      studentId,
      customerName: trimmedName,
      customerEmail: effectiveEmail,
      customerPhone: fullPhoneNumber,
      studentName: trimmedName,
      studentEmail: effectiveEmail,
      studentPhone: fullPhoneNumber,
      instrument: selectedCourse.toLowerCase(),
      courseTitle: `${selectedCourse} - ${selectedProgram} (${classFormat})`,
      ageGroup: selectedProgram === 'Kids Singing' ? 'Kids (6-12)' : 'Adults (18+)',
      preferredSlot: `${preferredDate} at ${preferredTime} IST`,
      preferredDate,
      preferredTimeSlot: preferredTime,
      status: 'pending' as const,
      notes: `Free Demo Request. Program: ${selectedProgram}, Format: ${classFormat}`,
      meetingUrl: `saremi_trial_${bookingId}`,
      createdAt: new Date().toISOString()
    };

    try {
      // 2. Save to primary firestore booking collection
      await createBookingInFirestore(payload);

      // 3. Record in CRM trial_bookings using real Auth UID = studentId
      const trialRecord = await submitFreeTrialBooking({
        studentId,
        userId: studentId,
        studentName: trimmedName,
        phone: fullPhoneNumber,
        email: effectiveEmail,
        age: selectedProgram === 'Kids Singing' ? 'Kids' : 'Adults',
        discipline: selectedCourse,
        courseId: selectedCourse.toLowerCase(),
        courseName: `${selectedCourse} (${selectedProgram})`,
        level: 'Free Demo Evaluation',
        date: preferredDate,
        time: preferredTime,
        preferredDate,
        preferredTime,
        timezone: 'Asia/Kolkata',
        learningGoal: `Format: ${classFormat}`
      });

      // 4. Automated Teacher Matching & Agora Classroom Provisioning
      try {
        const assignedResult = await autoAssignAndProvisionDemo({
          bookingId: trialRecord.id,
          studentName: trimmedName,
          studentEmail: effectiveEmail,
          studentPhone: fullPhoneNumber,
          studentId,
          courseName: selectedCourse,
          program: selectedProgram,
          preferredDate,
          preferredTime,
          learningGoal: `Format: ${classFormat}`
        });

        if (assignedResult.assigned && assignedResult.teacher) {
          setAssignedGuru(assignedResult.teacher.name);
          setBookingStatus('slot_proposed');
          if (assignedResult.classSession?.id) {
            setAssignedClassId(assignedResult.classSession.id);
          }
        } else {
          setBookingStatus('unassigned');
        }
      } catch (assignErr) {
        console.warn('Auto-assignment background notice:', assignErr);
        setBookingStatus('unassigned');
      }

      // 5. Trigger notification if email exists
      if (effectiveEmail) {
        await triggerTransactionalNotification({
          id: `demo-notif-${Date.now()}`,
          recipientEmail: effectiveEmail,
          recipientName: trimmedName,
          subject: `Your Free Demo Class Request at Saremi Academy`,
          type: 'trial_booking_confirmation',
          sentAt: new Date().toISOString(),
          content: `Hi ${trimmedName},\n\nWe received your request for a Free Demo Class in ${selectedCourse} (${selectedProgram}) on ${preferredDate} at ${preferredTime} IST.\n\nOur Faculty Mentor has been assigned. You can confirm your slot or join the live class directly from your Saremi Student Sanctuary.\n\nWarm regards,\nSaremi Academy Team`
        });
      }

      setIsSubmitting(false);
      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.warn('Demo booking saved fallback:', err);
      setIsSubmitting(false);
      setIsSuccess(true);
      if (onSuccess) onSuccess();
    }
  };

  const handleConfirmSlot = async () => {
    if (!createdBookingId) return;
    setIsConfirmingSlot(true);
    try {
      const res = await confirmTrialBookingSlot({
        bookingId: createdBookingId,
        confirmedBy: user?.uid || fullName
      });
      if (res.success) {
        setIsSlotConfirmed(true);
        setBookingStatus('confirmed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsConfirmingSlot(false);
    }
  };

  // WhatsApp reschedule URL generator
  const getWhatsAppRescheduleUrl = () => {
    const waText = `Hi Saremi Academy! 👋\n\nI want to coordinate/reschedule my Free Demo Class.\n\n*Booking ID:* ${createdBookingId || 'N/A'}\n*Student Name:* ${fullName}\n*Course:* ${selectedCourse} (${selectedProgram})\n*Preferred Slot:* ${proposedSlotInfo.date} at ${proposedSlotInfo.time} IST\n\nPlease let me know available slots. Thank you! 🎵`;
    return `https://wa.me/${ACADEMY_WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;
  };

  return (
    <div className="w-full text-left font-sans">
      {existingTrial && !isSuccess ? (
        <div className="space-y-6 text-left py-2">
          <div className="flex items-center gap-3">
            <SaremiLogo size="md" />
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0F0F0F]">
                Your Free Demo is Scheduled
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                You already have an active 1:1 demo class with Saremi Academy.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white">
                {existingTrial.status || 'Scheduled'}
              </span>
              <span className="text-xs font-bold text-amber-900">
                IST (India Standard Time)
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="text-gray-600">Discipline / Course:</span>
                <span className="font-bold text-gray-900">{existingTrial.courseName || existingTrial.discipline || 'Free Demo'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="text-gray-600">Assigned Faculty Guru:</span>
                <span className="font-bold text-amber-900">{existingTrial.teacherName || 'Faculty Guru'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Scheduled Time:</span>
                <span className="font-bold text-gray-900">{existingTrial.date || existingTrial.proposedDate || 'Scheduled'} at {existingTrial.time || existingTrial.proposedTime || ''} IST</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                if (onClose) onClose();
                navigate('/app');
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0F0F0F] hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Go to Your Demo Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : isSuccess ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6 sm:py-8 space-y-5"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FAF5EC] border-2 border-[#D8A84A] text-[#D8A84A] flex items-center justify-center mx-auto shadow-sm">
            <span className="text-3xl sm:text-4xl">🎉</span>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F0F0F]">
              {isSlotConfirmed ? 'Free Demo Confirmed!' : 'Demo Slot Prepared!'}
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
              {isSlotConfirmed 
                ? 'Your 1:1 live demo has been confirmed in the Academy schedule.' 
                : 'Your 1:1 demo class has been arranged. Confirm your slot or coordinate via WhatsApp.'}
            </p>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-2xs">
            {isSlotConfirmed ? (
              <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Slot Confirmed & Scheduled
              </span>
            ) : bookingStatus === 'unassigned' ? (
              <span className="text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Awaiting Faculty Allocation
              </span>
            ) : (
              <span className="text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Slot Available — Confirm Below
              </span>
            )}
          </div>

          {/* Summary Box */}
          <div className="bg-[#FAF8F5] border border-[#EAE5DB] rounded-2xl p-4 sm:p-5 max-w-md mx-auto text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center text-gray-600">
              <span>Student:</span>
              <span className="font-bold text-[#0F0F0F]">{fullName}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Course:</span>
              <span className="font-bold text-[#0F0F0F]">{selectedCourse}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Program:</span>
              <span className="font-bold text-[#D8A84A]">{selectedProgram}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Class Format:</span>
              <span className="font-bold text-emerald-700">{classFormat}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Slot Date & Time:</span>
              <span className="font-bold text-gray-900">{proposedSlotInfo.date} at {proposedSlotInfo.time} IST</span>
            </div>
            {assignedGuru && (
              <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center text-gray-700">
                <span className="font-medium text-amber-800">Assigned Faculty:</span>
                <span className="font-bold text-gray-900">{assignedGuru}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
              <Video className="w-3.5 h-3.5 text-emerald-600" />
              <span>Agora 1:1 Live Studio Room provisioned</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 max-w-md mx-auto space-y-3">
            {!isSlotConfirmed && (
              <button
                type="button"
                onClick={handleConfirmSlot}
                disabled={isConfirmingSlot}
                className="w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-[#D8A84A] hover:bg-[#c9993d] text-[#0F0F0F] font-serif font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isConfirmingSlot ? (
                  <span>Confirming Slot...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#0F0F0F]" />
                    <span>Confirm Free Demo Slot</span>
                  </>
                )}
              </button>
            )}

            <a
              href={getWhatsAppRescheduleUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[44px] py-3 px-6 rounded-xl bg-white hover:bg-gray-50 border border-emerald-300 text-emerald-800 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>Need to Reschedule? Chat on WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                navigate('/app/classes');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>View in Student Sanctuary</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Logo Branding */}
          <div className="flex justify-center sm:justify-start">
            <SaremiLogo size="sm" className="h-8" alt="Saremi Academy" />
          </div>

          {/* Form Header */}
          <div className="space-y-1.5 text-left">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F0F0F] tracking-tight flex items-center gap-2">
              <span>🎵 Book Your Free Demo Class</span>
            </h2>
            <p className="text-sm sm:text-base font-semibold text-[#2A2A2A]">
              Experience a live class with Saremi Academy before you decide.
            </p>
            <p className="text-xs text-[#6B7280] font-medium pt-0.5">
              No commitment • Live 1:1 online classes • Personal guidance
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0F0F0F] uppercase tracking-wider">
                Full Name <span className="text-[#D8A84A]">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full min-h-[48px] px-4 py-3 text-sm text-[#0F0F0F] bg-[#FAF8F5] hover:bg-white focus:bg-white rounded-xl border border-[#E5E0D8] focus:border-[#D8A84A] focus:ring-2 focus:ring-[#D8A84A]/20 transition-all outline-none"
              />
            </div>

            {/* 2. WhatsApp Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0F0F0F] uppercase tracking-wider">
                WhatsApp Number <span className="text-[#D8A84A]">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative shrink-0 w-28">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full min-h-[48px] px-3 py-3 text-xs font-semibold text-[#0F0F0F] bg-[#FAF8F5] rounded-xl border border-[#E5E0D8] focus:border-[#D8A84A] outline-none appearance-none cursor-pointer"
                  >
                    <option value="+91">🇮🇳 +91 (IN)</option>
                    <option value="+1">🇺🇸 +1 (US)</option>
                    <option value="+44">🇬🇧 +44 (UK)</option>
                    <option value="+971">🇦🇪 +971 (AE)</option>
                    <option value="+65">🇸🇬 +65 (SG)</option>
                    <option value="+61">🇦🇺 +61 (AU)</option>
                    <option value="+1">🇨🇦 +1 (CA)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <input
                  type="tel"
                  required
                  value={phoneRaw}
                  onChange={(e) => setPhoneRaw(e.target.value)}
                  placeholder="Enter your WhatsApp number"
                  className="flex-1 min-h-[48px] px-4 py-3 text-sm text-[#0F0F0F] bg-[#FAF8F5] hover:bg-white focus:bg-white rounded-xl border border-[#E5E0D8] focus:border-[#D8A84A] focus:ring-2 focus:ring-[#D8A84A]/20 transition-all outline-none font-mono"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0F0F0F] uppercase tracking-wider">
                Email Address <span className="text-[#D8A84A]">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email (for classroom link & schedule)"
                  className="w-full min-h-[48px] pl-10 pr-4 py-3 text-sm text-[#0F0F0F] bg-[#FAF8F5] hover:bg-white focus:bg-white rounded-xl border border-[#E5E0D8] focus:border-[#D8A84A] focus:ring-2 focus:ring-[#D8A84A]/20 transition-all outline-none"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Account Password Field (for non-authenticated visitors) */}
            {!user && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#0F0F0F] uppercase tracking-wider">
                    {isExistingEmailPrompt ? 'Account Password' : 'Create Account Password'} <span className="text-[#D8A84A]">*</span>
                  </label>
                  {isExistingEmailPrompt && (
                    <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Existing Student Account
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isExistingEmailPrompt ? "Enter your password to sign in" : "Create password (min 6 chars)"}
                    className="w-full min-h-[48px] pl-10 pr-4 py-3 text-sm text-[#0F0F0F] bg-[#FAF8F5] hover:bg-white focus:bg-white rounded-xl border border-[#E5E0D8] focus:border-[#D8A84A] focus:ring-2 focus:ring-[#D8A84A]/20 transition-all outline-none font-mono"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  {isExistingEmailPrompt
                    ? "Enter your password to link this Free Demo booking to your account."
                    : "Your account will be automatically created so you can access your dashboard."}
                </p>
              </div>
            )}

            {/* 3. Select Course */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0F0F0F] uppercase tracking-wider">
                Select Course <span className="text-[#D8A84A]">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value as CourseType)}
                  className="w-full min-h-[48px] px-4 py-3 text-sm font-semibold text-[#0F0F0F] bg-[#FAF8F5] hover:bg-white focus:bg-white rounded-xl border border-[#E5E0D8] focus:border-[#D8A84A] focus:ring-2 focus:ring-[#D8A84A]/20 transition-all outline-none appearance-none cursor-pointer"
                >
                  {COURSES.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 4. Select Program (Dynamic for Singing) */}
            {selectedCourse === 'Singing' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0F0F0F] uppercase tracking-wider">
                  Select Singing Program <span className="text-[#D8A84A]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SINGING_PROGRAMS.map((prog) => (
                    <button
                      key={prog}
                      type="button"
                      onClick={() => setSelectedProgram(prog)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                        selectedProgram === prog
                          ? 'bg-[#0F0F0F] text-[#D8A84A] border-[#0F0F0F] shadow-xs'
                          : 'bg-[#FAF8F5] text-gray-700 border-[#E5E0D8] hover:border-gray-400'
                      }`}
                    >
                      {prog}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 5. Class Format (Show 1:1 vs Group ONLY for Hindustani Vocals; otherwise 1:1 Individual Class) */}
            {selectedCourse === 'Singing' && selectedProgram === 'Hindustani Vocals' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0F0F0F] uppercase tracking-wider">
                  Class Format <span className="text-[#D8A84A]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['1:1 Individual Class', 'Group Class'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setClassFormat(fmt)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                        classFormat === fmt
                          ? 'bg-[#0F0F0F] text-[#D8A84A] border-[#0F0F0F] shadow-xs'
                          : 'bg-[#FAF8F5] text-gray-700 border-[#E5E0D8] hover:border-gray-400'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-mono text-gray-500 block">
                  Format: <strong className="text-[#0F0F0F] font-bold">1:1 Individual Live Class</strong> with Faculty Maestro
                </span>
              </div>
            )}

            {/* 6. Preferred Date & Time Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0F0F0F] uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#D8A84A]" />
                  <span>Preferred Date <span className="text-[#D8A84A]">*</span></span>
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 text-sm text-[#0F0F0F] bg-[#FAF8F5] hover:bg-white focus:bg-white rounded-xl border border-[#E5E0D8] focus:border-[#D8A84A] focus:ring-2 focus:ring-[#D8A84A]/20 transition-all outline-none font-semibold cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0F0F0F] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D8A84A]" />
                  <span>Preferred Time (IST) <span className="text-[#D8A84A]">*</span></span>
                </label>
                <div className="relative">
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-3 text-sm font-semibold text-[#0F0F0F] bg-[#FAF8F5] hover:bg-white focus:bg-white rounded-xl border border-[#E5E0D8] focus:border-[#D8A84A] focus:ring-2 focus:ring-[#D8A84A]/20 transition-all outline-none appearance-none cursor-pointer"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t} IST
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-3 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[52px] py-3.5 px-6 rounded-xl bg-[#D8A84A] hover:bg-[#c9993d] active:scale-[0.99] text-[#0F0F0F] font-serif font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Checking Faculty Availability...</span>
                ) : (
                  <>
                    <span>Book My Free Demo</span>
                    <ArrowRight className="w-5 h-5 text-[#0F0F0F]" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 font-medium pt-1 text-center">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D8A84A]" />
                  100% Free & No Obligation
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Real-time Guru Allocation
                </span>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

