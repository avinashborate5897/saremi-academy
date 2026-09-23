import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Star, 
  CalendarOff,
  Filter,
  RefreshCw
} from 'lucide-react';
import { 
  AvailableTimeSlot, 
  ClassSession,
  WeeklyAvailabilitySlot,
  TeacherBlockedTime,
  AcademyBlockedDate
} from '../../types';
import { 
  calculateAvailableSlots, 
  formatTime12Hour,
  subscribeToTeacherWeeklyAvailability,
  subscribeToTeacherBlockedTimes,
  subscribeToAcademyBlockedDates
} from '../../lib/sessionService';

interface IntelligentSlotPickerProps {
  teacherId: string;
  teacherName?: string;
  date: string;
  durationMinutes: number;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  studentPreferences?: {
    preferredDays?: string[];
    preferredTimeOfDay?: string;
    preferredTimeSlots?: string[];
  };
  excludeSessionId?: string;
  existingClasses?: ClassSession[];
}

export const IntelligentSlotPicker: React.FC<IntelligentSlotPickerProps> = ({
  teacherId,
  teacherName,
  date,
  durationMinutes,
  selectedTime,
  onSelectTime,
  studentPreferences,
  excludeSessionId,
  existingClasses
}) => {
  const [slots, setSlots] = useState<AvailableTimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailabilitySlot[]>([]);
  const [teacherBlockedTimes, setTeacherBlockedTimes] = useState<TeacherBlockedTime[]>([]);
  const [academyBlockedDates, setAcademyBlockedDates] = useState<AcademyBlockedDate[]>([]);

  useEffect(() => {
    if (!teacherId) {
      setWeeklyAvailability([]);
      setTeacherBlockedTimes([]);
      return;
    }

    const unsubAvail = subscribeToTeacherWeeklyAvailability(teacherId, (slots) => {
      setWeeklyAvailability(slots);
    });
    const unsubTeacherBlocked = subscribeToTeacherBlockedTimes(teacherId, (blocks) => {
      setTeacherBlockedTimes(blocks);
    });
    const unsubAcademy = subscribeToAcademyBlockedDates((dates) => {
      setAcademyBlockedDates(dates);
    });

    return () => {
      unsubAvail();
      unsubTeacherBlocked();
      unsubAcademy();
    };
  }, [teacherId]);

  useEffect(() => {
    if (!teacherId || !date) {
      setSlots([]);
      return;
    }

    setLoading(true);

    try {
      const calculated = calculateAvailableSlots({
        teacherId,
        date,
        durationMinutes,
        weeklyAvailability,
        teacherBlockedTimes,
        academyBlockedDates,
        existingSessions: existingClasses || [],
        excludeSessionId,
        studentPreferences: studentPreferences ? {
          preferredDays: studentPreferences.preferredDays,
          preferredTimeSlot: studentPreferences.preferredTimeOfDay
        } : undefined
      });

      setSlots(calculated.slots);
      setLoading(false);

      // If current selectedTime is not in calculated or is blocked, suggest first available slot
      const availableSlots = calculated.slots.filter((s) => s.isAvailable);
      if (availableSlots.length > 0 && !selectedTime) {
        // Pick slot that matches student preference first, or first available
        const preferredSlot = availableSlots.find((s) => s.isStudentPreferred) || availableSlots[0];
        onSelectTime(preferredSlot.startTime);
      }
    } catch (err) {
      console.error('Error calculating available slots:', err);
      setSlots([]);
      setLoading(false);
    }
  }, [
    teacherId,
    date,
    durationMinutes,
    weeklyAvailability,
    teacherBlockedTimes,
    academyBlockedDates,
    existingClasses,
    excludeSessionId,
    studentPreferences,
    refreshTrigger
  ]);

  const availableSlots = slots.filter((s) => s.isAvailable);
  const blockedSlots = slots.filter((s) => !s.isAvailable);
  const displaySlots = showOnlyAvailable ? availableSlots : slots;

  // Check if entire day is blocked by Academy closure or Teacher off
  const academyHoliday = slots.find((s) => s.conflictReason?.toLowerCase().includes('academy holiday') || s.conflictReason?.toLowerCase().includes('closure'));
  const isTeacherDayOff = slots.length === 0 || slots.every((s) => s.conflictReason?.includes('not marked as active') || s.conflictReason?.includes('outside'));

  return (
    <div className="space-y-3 text-left">
      {/* Header with Slot Summary & Preference Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-slate-700 font-bold text-xs flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Intelligent Time Slot Suggestions</span>
        </label>

        <div className="flex items-center gap-2">
          {slots.length > 0 && (
            <button
              type="button"
              onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
              className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
            >
              <Filter className="w-3 h-3" />
              <span>{showOnlyAvailable ? 'Show All Slots' : 'Show Available Only'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            className="text-[10px] text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
            title="Refresh availability"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Student Preference Pill */}
      {studentPreferences?.preferredTimeOfDay && (
        <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-[11px] text-amber-900">
          <span className="flex items-center gap-1.5 font-medium">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Student Preferred Timing: <strong>{studentPreferences.preferredTimeOfDay}</strong></span>
          </span>
          <span className="text-[10px] text-amber-700 font-semibold bg-amber-100/80 px-2 py-0.5 rounded">
            Starred slots match preferences
          </span>
        </div>
      )}

      {/* Slots Loading State */}
      {loading ? (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span>Checking guru availability, leaves, and conflicts...</span>
        </div>
      ) : academyHoliday ? (
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-900 flex items-start gap-2">
          <CalendarOff className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Academy Closed on this Date</span>
            <p className="text-[11px] mt-0.5 text-rose-700">
              {academyHoliday.conflictReason || 'Conservatory Holiday'}. Please select an alternate date for this session.
            </p>
          </div>
        </div>
      ) : availableSlots.length === 0 ? (
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Custom / Manual Slot Selection</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {teacherName || 'Faculty Guru'} availability for this date is open or unconfigured.
            Select a common academy time slot below or enter an exact time:
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-1">
            {['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onSelectTime(t)}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  selectedTime === t
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white border-amber-200 text-amber-900 hover:bg-amber-100/70'
                }`}
              >
                {t} IST
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Slot Chips Grid */
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
            {displaySlots.map((slot) => {
              const isSelected = selectedTime === slot.startTime;
              const isAvailable = slot.isAvailable;
              const isPreferred = slot.isStudentPreferred;

              return (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => onSelectTime(slot.startTime)}
                  className={`p-2 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    !isAvailable
                      ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed text-slate-400'
                      : isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs cursor-pointer'
                      : isPreferred
                      ? 'bg-amber-50/70 border-amber-300 text-amber-950 hover:bg-amber-100/80 cursor-pointer'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50 cursor-pointer'
                  }`}
                  title={slot.conflictReason}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs leading-none">
                      {slot.startTime}
                    </span>
                    {isPreferred && (
                      <Star className={`w-3 h-3 ${isSelected ? 'text-amber-400 fill-amber-400' : 'text-amber-500 fill-amber-400'}`} />
                    )}
                    {isSelected && (
                      <Check className="w-3 h-3 text-amber-400" />
                    )}
                  </div>

                  <span className={`text-[10px] mt-1 truncate ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {formatTime12Hour(slot.startTime)}
                  </span>

                  {!isAvailable && slot.conflictReason && (
                    <span className="text-[9px] text-red-600 mt-1 line-clamp-1">
                      {slot.conflictReason}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>
              <strong>{availableSlots.length}</strong> available slots
              {studentPreferences?.preferredTimeOfDay && (
                <> (<strong>{availableSlots.filter((s) => s.isStudentPreferred).length}</strong> match preferences)</>
              )}
            </span>
            <span className="text-[10px] text-slate-400">Times shown in IST</span>
          </div>
        </div>
      )}

      {/* Fallback Manual Time Input */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
        <span className="text-[11px] text-slate-500 font-medium">
          Or specify exact time:
        </span>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => onSelectTime(e.target.value)}
            className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
            {formatTime12Hour(selectedTime)} IST
          </span>
        </div>
      </div>
    </div>
  );
};
