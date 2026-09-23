import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CalendarOff, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { AcademyBlockedDate } from '../../types';
import { 
  subscribeToAcademyBlockedDates, 
  addAcademyBlockedDate, 
  removeAcademyBlockedDate 
} from '../../lib/sessionService';

interface AcademyBlockedDatesManagerProps {
  actor: {
    id: string;
    name?: string;
    role: string;
  };
}

export const AcademyBlockedDatesManager: React.FC<AcademyBlockedDatesManagerProps> = ({ actor }) => {
  const [blockedDates, setBlockedDates] = useState<AcademyBlockedDate[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('21:00');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAcademyBlockedDates((dates) => {
      setBlockedDates(dates);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title.trim()) {
      setFormError('Please provide a title or occasion for the closure (e.g., Diwali Holiday, Conservatory Maintenance).');
      return;
    }
    if (!date) {
      setFormError('Please select a date.');
      return;
    }
    if (!isFullDay && startTime >= endTime) {
      setFormError('Start time must be earlier than end time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reasonText = notes.trim() ? `${title.trim()} (${notes.trim()})` : title.trim();
      const result = await addAcademyBlockedDate({
        date,
        reason: reasonText,
        isFullDay,
        startTime: isFullDay ? undefined : startTime,
        endTime: isFullDay ? undefined : endTime,
        createdBy: actor.id,
        createdByName: actor.name || 'Academic Operations'
      });

      if (result.success) {
        setFormSuccess(`"${title.trim()}" successfully registered. All scheduling on this date is now protected.`);
        setTitle('');
        setNotes('');
        setIsFullDay(true);
        setTimeout(() => setFormSuccess(null), 3500);
      } else {
        setFormError(result.error || 'Failed to add academy blocked date.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving closure date.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveBlockedDate = async (blockedDate: AcademyBlockedDate) => {
    if (!confirm(`Are you sure you want to remove "${blockedDate.reason}" (${blockedDate.date}) from academy closures? Sessions will be allowed to be booked again.`)) {
      return;
    }
    try {
      const result = await removeAcademyBlockedDate(blockedDate.id, {
        id: actor.id,
        name: actor.name || 'Academic Operations',
        role: 'admin'
      });
      if (!result.success) {
        alert(result.error || 'Failed to remove closure.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting closure date.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
            <CalendarOff className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Academy-Wide Holiday & Closure Calendar
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Define academy-wide holiday closures, festival breaks (e.g. Diwali, Holi), and annual conservatory maintenance days. Dates configured here are automatically enforced by the timetable engine to prevent any session from being booked across all faculty and student rosters.
            </p>
          </div>
        </div>
      </div>

      {/* Add Closure Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
        <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-600" />
          <span>Register Academy Holiday or Closure Date</span>
        </h4>

        {formError && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{formSuccess}</span>
          </div>
        )}

        <form onSubmit={handleAddBlockedDate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Occasion / Closure Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Diwali Festival Break, Independence Day, Conservatory Maintenance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-bold">
              <input
                type="checkbox"
                checked={isFullDay}
                onChange={(e) => setIsFullDay(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span>Full Day Academy Closure (All hours blocked)</span>
            </label>

            {!isFullDay && (
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-[11px]">Partial Hours:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-slate-400 font-bold">to</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-slate-500 text-[11px]">IST</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Internal Administrative Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. All regular 1:1 and trial sessions will automatically bypass this date in the scheduling engine."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CalendarOff className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSubmitting ? 'Registering...' : 'Save Closure Date'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Blocked Dates List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
        <h4 className="font-serif text-base font-bold text-slate-900 mb-3 flex items-center justify-between">
          <span>Scheduled Academy Closures ({blockedDates.length})</span>
          <span className="text-[11px] font-mono text-slate-400 font-normal">Active System-Wide</span>
        </h4>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading academy closures...
          </div>
        ) : blockedDates.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-xs">No academy closure dates registered</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Academy operations and 1:1 session bookings will remain active every day according to teacher availability.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {blockedDates.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-amber-200/80 bg-[#FAF8F5] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 leading-snug">
                      {item.reason}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockedDate(item)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer shrink-0"
                      title="Delete this closure"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md">
                      {item.date}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                      {item.isFullDay ? 'All Day' : `${item.startTime} – ${item.endTime} IST`}
                    </span>
                  </div>

                  {(item as any).notes && (
                    <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {(item as any).notes}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Registered by {item.createdByName || 'Admin'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
