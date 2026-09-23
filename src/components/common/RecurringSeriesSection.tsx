import React, { useState, useEffect } from 'react';
import { 
  Repeat, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  ClassSession,
  WeeklyAvailabilitySlot,
  TeacherBlockedTime,
  AcademyBlockedDate
} from '../../types';
import { 
  validateRecurringSeriesOccurrences, 
  formatTime12Hour,
  subscribeToTeacherWeeklyAvailability,
  subscribeToTeacherBlockedTimes,
  subscribeToAcademyBlockedDates
} from '../../lib/sessionService';

interface OccurrenceValidationItem {
  occurrenceIndex: number;
  date: string;
  startTime: string;
  endTime: string;
  isValid: boolean;
  conflictReason?: string;
}

interface RecurringSeriesSectionProps {
  isRecurring: boolean;
  onToggleRecurring: (enabled: boolean) => void;
  frequency: 'weekly' | 'bi-weekly';
  onChangeFrequency: (freq: 'weekly' | 'bi-weekly') => void;
  totalOccurrences: number;
  onChangeTotalOccurrences: (count: number) => void;
  maxAllowedOccurrences?: number;
  startDate: string;
  startTime: string;
  durationMinutes: number;
  teacherId: string;
  studentId: string;
  existingClasses?: ClassSession[];
  weeklyAvailability?: WeeklyAvailabilitySlot[];
  teacherBlockedTimes?: TeacherBlockedTime[];
  academyBlockedDates?: AcademyBlockedDate[];
  onValidationChange: (isValid: boolean, conflictSummary?: string) => void;
}

export const RecurringSeriesSection: React.FC<RecurringSeriesSectionProps> = ({
  isRecurring,
  onToggleRecurring,
  frequency,
  onChangeFrequency,
  totalOccurrences,
  onChangeTotalOccurrences,
  maxAllowedOccurrences = 12,
  startDate,
  startTime,
  durationMinutes,
  teacherId,
  studentId,
  existingClasses,
  weeklyAvailability: propAvailability,
  teacherBlockedTimes: propTeacherBlocked,
  academyBlockedDates: propAcademyBlocked,
  onValidationChange
}) => {
  const [validating, setValidating] = useState<boolean>(false);
  const [occurrences, setOccurrences] = useState<OccurrenceValidationItem[]>([]);
  const [showScheduleList, setShowScheduleList] = useState<boolean>(true);

  const [internalAvailability, setInternalAvailability] = useState<WeeklyAvailabilitySlot[]>([]);
  const [internalTeacherBlocked, setInternalTeacherBlocked] = useState<TeacherBlockedTime[]>([]);
  const [internalAcademyBlocked, setInternalAcademyBlocked] = useState<AcademyBlockedDate[]>([]);

  useEffect(() => {
    if (!teacherId) {
      setInternalAvailability([]);
      setInternalTeacherBlocked([]);
      return;
    }
    const unsubAvail = subscribeToTeacherWeeklyAvailability(teacherId, (slots) => {
      setInternalAvailability(slots);
    });
    const unsubTeacherBlocked = subscribeToTeacherBlockedTimes(teacherId, (blocks) => {
      setInternalTeacherBlocked(blocks);
    });
    const unsubAcademy = subscribeToAcademyBlockedDates((dates) => {
      setInternalAcademyBlocked(dates);
    });
    return () => {
      unsubAvail();
      unsubTeacherBlocked();
      unsubAcademy();
    };
  }, [teacherId]);

  const effectiveAvailability = propAvailability ?? internalAvailability;
  const effectiveTeacherBlocked = propTeacherBlocked ?? internalTeacherBlocked;
  const effectiveAcademyBlocked = propAcademyBlocked ?? internalAcademyBlocked;

  useEffect(() => {
    if (!isRecurring) {
      setOccurrences([]);
      onValidationChange(true);
      return;
    }

    if (!startDate || !startTime || !teacherId) {
      setOccurrences([]);
      onValidationChange(false, 'Missing start date, time, or assigned teacher.');
      return;
    }

    setValidating(true);

    try {
      const report = validateRecurringSeriesOccurrences(
        {
          startDate,
          startTime,
          durationMinutes,
          totalSessions: totalOccurrences,
          frequencyWeeks: frequency === 'bi-weekly' ? 2 : 1,
          teacherId,
          studentId
        },
        existingClasses || [],
        effectiveAvailability,
        effectiveTeacherBlocked,
        effectiveAcademyBlocked
      );

      const items: OccurrenceValidationItem[] = report.occurrences.map((occ, idx) => ({
        occurrenceIndex: idx,
        date: occ.date,
        startTime: occ.startTime,
        endTime: occ.endTime,
        isValid: occ.isValid,
        conflictReason: occ.conflictReason
      }));

      setOccurrences(items);
      setValidating(false);

      if (!report.isValid) {
        const firstConflict = items.find((r) => !r.isValid);
        onValidationChange(
          false,
          `Occurrence #${(firstConflict?.occurrenceIndex || 0) + 1} on ${firstConflict?.date} has a conflict: ${firstConflict?.conflictReason || 'Conflict'}`
        );
      } else {
        onValidationChange(true);
      }
    } catch (err: any) {
      setValidating(false);
      onValidationChange(false, err.message || 'Error validating series');
    }
  }, [
    isRecurring,
    frequency,
    totalOccurrences,
    startDate,
    startTime,
    durationMinutes,
    teacherId,
    studentId,
    existingClasses,
    effectiveAvailability,
    effectiveTeacherBlocked,
    effectiveAcademyBlocked
  ]);

  const invalidCount = occurrences.filter((o) => !o.isValid).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-left">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => onToggleRecurring(e.target.checked)}
            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
          />
          <div>
            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-amber-600" />
              <span>Schedule as Recurring Term Series</span>
            </span>
            <span className="text-[11px] text-slate-500 block">
              Automatically books weekly or bi-weekly occurrences with pre-conflict checks.
            </span>
          </div>
        </label>
      </div>

      {isRecurring && (
        <div className="pt-2 border-t border-slate-200/80 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => onChangeFrequency(e.target.value as 'weekly' | 'bi-weekly')}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
              >
                <option value="weekly">Weekly (Once every 7 days)</option>
                <option value="bi-weekly">Bi-Weekly (Twice a week / every 3-4 days)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Total Sessions ({totalOccurrences})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={2}
                  max={Math.max(2, maxAllowedOccurrences)}
                  value={totalOccurrences}
                  onChange={(e) => onChangeTotalOccurrences(Math.max(2, Math.min(maxAllowedOccurrences, Number(e.target.value))))}
                  className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-mono font-bold"
                />
                <span className="text-[11px] text-slate-500">
                  sessions (Quota: max {maxAllowedOccurrences})
                </span>
              </div>
            </div>
          </div>

          {/* Validation Status Banner */}
          {validating ? (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span>Validating all {totalOccurrences} series occurrences for holidays & conflicts...</span>
            </div>
          ) : invalidCount > 0 ? (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">
                  {invalidCount} of {totalOccurrences} Occurrences Have Conflicts:
                </strong>
                <p className="text-[11px] mt-0.5 text-rose-800">
                  Please review the dates below. Adjust the starting time or date to avoid holidays and leave blocks before booking.
                </p>
              </div>
            </div>
          ) : occurrences.length > 0 ? (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All {totalOccurrences} occurrences are verified and conflict-free. Ready for atomic creation.</span>
            </div>
          ) : null}

          {/* Occurrence Preview List */}
          {occurrences.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={() => setShowScheduleList(!showScheduleList)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 hover:text-slate-900 py-1"
              >
                <span>Preview Occurrence Dates ({occurrences.length})</span>
                {showScheduleList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showScheduleList && (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {occurrences.map((item) => (
                    <div
                      key={item.occurrenceIndex}
                      className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                        item.isValid
                          ? 'bg-white border-slate-200 text-slate-800'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center">
                          {item.occurrenceIndex + 1}
                        </span>
                        <div>
                          <span className="font-bold">{item.date}</span>
                          <span className="text-[11px] text-slate-500 ml-1.5">
                            at {item.startTime} – {item.endTime} IST
                          </span>
                        </div>
                      </div>

                      {item.isValid ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Valid
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1" title={item.conflictReason}>
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          {item.conflictReason || 'Conflict'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
