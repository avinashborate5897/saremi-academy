import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Copy,
  CalendarOff,
  Sun,
  Moon
} from 'lucide-react';
import { 
  WeeklyAvailabilitySlot, 
  TeacherBlockedTime 
} from '../../types';
import { 
  WEEK_DAY_NAMES,
  WEEK_DAY_ABBRS,
  formatTime12Hour,
  subscribeToTeacherWeeklyAvailability,
  saveTeacherWeeklyAvailability,
  subscribeToTeacherBlockedTimes,
  addTeacherBlockedTime,
  removeTeacherBlockedTime
} from '../../lib/sessionService';

interface TeacherAvailabilityManagerProps {
  teacherId: string;
  teacherName?: string;
  actor: {
    id: string;
    name?: string;
    role: 'admin' | 'teacher';
  };
  isAdminMode?: boolean;
}

interface DayConfig {
  dayOfWeek: number;
  dayName: string;
  isActive: boolean;
  windows: Array<{
    id: string;
    startTime: string;
    endTime: string;
  }>;
}

export const TeacherAvailabilityManager: React.FC<TeacherAvailabilityManagerProps> = ({
  teacherId,
  teacherName,
  actor,
  isAdminMode = false
}) => {
  // Weekly Schedule State (Monday = 1 through Sunday = 0)
  const defaultDaysOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun

  const [days, setDays] = useState<DayConfig[]>(() =>
    defaultDaysOrder.map((dayOfWeek) => ({
      dayOfWeek,
      dayName: WEEK_DAY_NAMES[dayOfWeek],
      isActive: dayOfWeek >= 1 && dayOfWeek <= 5, // Mon-Fri active by default
      windows: [
        {
          id: `init_${dayOfWeek}_0`,
          startTime: '16:00',
          endTime: '20:00'
        }
      ]
    }))
  );

  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Temporary Blocked Periods State
  const [blockedTimes, setBlockedTimes] = useState<TeacherBlockedTime[]>([]);
  const [blockDate, setBlockDate] = useState<string>(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [blockStartTime, setBlockStartTime] = useState<string>('16:00');
  const [blockEndTime, setBlockEndTime] = useState<string>('18:00');
  const [blockReason, setBlockReason] = useState<string>('');
  const [isAddingBlock, setIsAddingBlock] = useState<boolean>(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [blockSuccess, setBlockSuccess] = useState<string | null>(null);

  // Subscribe to Teacher Weekly Availability
  useEffect(() => {
    if (!teacherId) return;

    const unsubscribe = subscribeToTeacherWeeklyAvailability(
      teacherId,
      (incomingSlots, configured) => {
        setIsConfigured(configured);
        if (incomingSlots && incomingSlots.length > 0) {
          // Group incoming slots by dayOfWeek
          const newDays: DayConfig[] = defaultDaysOrder.map((dayOfWeek) => {
            const daySlots = incomingSlots.filter((s) => s.dayOfWeek === dayOfWeek);
            const activeSlots = daySlots.filter((s) => s.isActive !== false);

            if (daySlots.length === 0) {
              return {
                dayOfWeek,
                dayName: WEEK_DAY_NAMES[dayOfWeek],
                isActive: false,
                windows: [
                  {
                    id: `${teacherId}_${dayOfWeek}_0`,
                    startTime: '16:00',
                    endTime: '20:00'
                  }
                ]
              };
            }

            return {
              dayOfWeek,
              dayName: WEEK_DAY_NAMES[dayOfWeek],
              isActive: activeSlots.length > 0,
              windows: (activeSlots.length > 0 ? activeSlots : daySlots).map((s, idx) => ({
                id: s.id || `${teacherId}_${dayOfWeek}_${idx}`,
                startTime: s.startTime || '16:00',
                endTime: s.endTime || '20:00'
              }))
            };
          });

          setDays(newDays);
        }
      }
    );

    return () => unsubscribe();
  }, [teacherId]);

  // Subscribe to Teacher Blocked Periods
  useEffect(() => {
    if (!teacherId) return;

    const unsubscribe = subscribeToTeacherBlockedTimes(teacherId, (blocks) => {
      setBlockedTimes(blocks);
    });

    return () => unsubscribe();
  }, [teacherId]);

  // Toggle Day Active
  const toggleDayActive = (dayOfWeek: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        return { ...d, isActive: !d.isActive };
      })
    );
  };

  // Add Window to a Day
  const handleAddWindow = (dayOfWeek: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const lastWindow = d.windows[d.windows.length - 1];
        let nextStart = '18:00';
        let nextEnd = '21:00';
        if (lastWindow) {
          // Start next window after last window end
          nextStart = lastWindow.endTime;
          const [h, m] = nextStart.split(':').map(Number);
          const endH = Math.min(23, h + 2);
          nextEnd = `${endH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
        }
        return {
          ...d,
          isActive: true,
          windows: [
            ...d.windows,
            {
              id: `${teacherId}_${dayOfWeek}_${Date.now()}_${d.windows.length}`,
              startTime: nextStart,
              endTime: nextEnd
            }
          ]
        };
      })
    );
  };

  // Update Window in a Day
  const handleUpdateWindow = (
    dayOfWeek: number,
    windowIdx: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const updatedWindows = [...d.windows];
        updatedWindows[windowIdx] = {
          ...updatedWindows[windowIdx],
          [field]: value
        };
        return { ...d, windows: updatedWindows };
      })
    );
  };

  // Remove Window from a Day
  const handleRemoveWindow = (dayOfWeek: number, windowIdx: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const updatedWindows = d.windows.filter((_, idx) => idx !== windowIdx);
        return {
          ...d,
          isActive: updatedWindows.length > 0 ? d.isActive : false,
          windows:
            updatedWindows.length > 0
              ? updatedWindows
              : [
                  {
                    id: `${teacherId}_${dayOfWeek}_fallback`,
                    startTime: '16:00',
                    endTime: '20:00'
                  }
                ]
        };
      })
    );
  };

  // Copy Monday's Schedule to Tuesday-Friday
  const handleCopyMonToWeekdays = () => {
    const monday = days.find((d) => d.dayOfWeek === 1);
    if (!monday) return;

    setDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek >= 2 && d.dayOfWeek <= 5) {
          return {
            ...d,
            isActive: monday.isActive,
            windows: monday.windows.map((w, idx) => ({
              id: `${teacherId}_${d.dayOfWeek}_copy_${idx}`,
              startTime: w.startTime,
              endTime: w.endTime
            }))
          };
        }
        return d;
      })
    );
  };

  // Save Weekly Availability to Firestore
  const handleSaveWeeklyAvailability = async () => {
    setSaveStatus('saving');
    setSaveError(null);

    // Validation: make sure startTime < endTime for each active window
    const flatSlots: WeeklyAvailabilitySlot[] = [];

    for (const day of days) {
      if (day.isActive) {
        for (let idx = 0; idx < day.windows.length; idx++) {
          const w = day.windows[idx];
          if (w.startTime >= w.endTime) {
            setSaveStatus('error');
            setSaveError(
              `Invalid window on ${day.dayName}: Start time (${w.startTime}) must be earlier than End time (${w.endTime}).`
            );
            return;
          }
          flatSlots.push({
            id: `${teacherId}_day${day.dayOfWeek}_w${idx}`,
            teacherId,
            dayOfWeek: day.dayOfWeek,
            dayName: day.dayName,
            startTime: w.startTime,
            endTime: w.endTime,
            isActive: true,
            updatedAt: new Date().toISOString(),
            updatedBy: actor.id
          });
        }
      }
    }

    try {
      const result = await saveTeacherWeeklyAvailability(teacherId, flatSlots, actor);
      if (result.success) {
        setSaveStatus('saved');
        setIsConfigured(true);
        setTimeout(() => setSaveStatus('idle'), 3500);
      } else {
        setSaveStatus('error');
        setSaveError(result.error || 'Failed to save weekly availability.');
      }
    } catch (err: any) {
      setSaveStatus('error');
      setSaveError(err.message || 'Error occurred while saving availability.');
    }
  };

  // Add Temporary Blocked Period
  const handleAddBlockedTime = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlockError(null);
    setBlockSuccess(null);

    if (!blockDate) {
      setBlockError('Please select a date for the blocked period.');
      return;
    }
    if (blockStartTime >= blockEndTime) {
      setBlockError('Start time must be before end time.');
      return;
    }
    if (!blockReason.trim()) {
      setBlockError('Please enter a reason (e.g. Doctor appointment, Concert, Travel).');
      return;
    }

    setIsAddingBlock(true);
    try {
      const result = await addTeacherBlockedTime({
        teacherId,
        teacherName: teacherName || actor.name || 'Faculty',
        date: blockDate,
        startTime: blockStartTime,
        endTime: blockEndTime,
        reason: blockReason.trim(),
        createdBy: actor.id,
        createdByName: actor.name || (actor.role === 'admin' ? 'Admin' : 'Teacher'),
        creatorRole: actor.role
      });

      if (result.success) {
        setBlockSuccess('Blocked period successfully recorded.');
        setBlockReason('');
        setTimeout(() => setBlockSuccess(null), 3000);
      } else {
        setBlockError(result.error || 'Failed to add blocked time.');
      }
    } catch (err: any) {
      setBlockError(err.message || 'Failed to save temporary block.');
    } finally {
      setIsAddingBlock(false);
    }
  };

  // Remove Temporary Blocked Period
  const handleRemoveBlockedTime = async (blockId: string) => {
    if (!confirm('Are you sure you want to remove this blocked time? This slot will become available for booking again.')) {
      return;
    }
    try {
      const result = await removeTeacherBlockedTime(blockId, actor);
      if (!result.success) {
        alert(result.error || 'Failed to remove blocked period.');
      }
    } catch (err: any) {
      alert(err.message || 'Error removing blocked period.');
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Configuration Status Banner */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isConfigured ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-gray-900">
                  {isAdminMode ? `Faculty Availability: ${teacherName || teacherId}` : 'Weekly Working Hours & Availability'}
                </h3>
                {isConfigured ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Active Working Windows
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Default / Unconfigured
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Define recurring daily teaching windows in Indian Standard Time (IST). You can configure multiple active windows per day (e.g. morning and evening slots) to prevent accidental overlaps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyMonToWeekdays}
              className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copy Monday's hours to Tuesday through Friday"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sync Mon → Fri</span>
            </button>

            <button
              type="button"
              onClick={handleSaveWeeklyAvailability}
              disabled={saveStatus === 'saving'}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saveStatus === 'saving' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Save Working Hours</span>
                </>
              )}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{saveError}</span>
          </div>
        )}

        {saveStatus === 'saved' && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Weekly availability successfully synchronized to academy timetable engine.</span>
          </div>
        )}
      </div>

      {/* 7-Day Timetable Grid */}
      <div className="space-y-4">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
          Weekly Working Schedule (Multiple Windows per Day Supported)
        </h4>

        <div className="grid grid-cols-1 gap-4">
          {days.map((day) => {
            return (
              <div
                key={day.dayOfWeek}
                className={`p-5 rounded-2xl border transition-all ${
                  day.isActive
                    ? 'bg-white border-gray-200 shadow-2xs'
                    : 'bg-gray-50/70 border-gray-200/80 opacity-75'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleDayActive(day.dayOfWeek)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        day.isActive ? 'bg-amber-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          day.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{day.dayName}</span>
                        {day.isActive ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Available ({day.windows.length} window{day.windows.length > 1 ? 's' : ''})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                            Day Off / Unavailable
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500">
                        {day.isActive ? 'Bookings enabled during configured windows' : 'No 1:1 sessions can be booked on this day'}
                      </span>
                    </div>
                  </div>

                  {day.isActive && (
                    <button
                      type="button"
                      onClick={() => handleAddWindow(day.dayOfWeek)}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Window</span>
                    </button>
                  )}
                </div>

                {/* Windows on this day */}
                {day.isActive && (
                  <div className="pt-4 space-y-3">
                    {day.windows.map((win, winIdx) => (
                      <div
                        key={win.id}
                        className="flex flex-wrap items-center gap-3 bg-[#FAF8F5] p-3 rounded-xl border border-gray-100"
                      >
                        <div className="flex items-center gap-1 text-xs text-gray-500 font-mono">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[10px] font-bold">
                            {winIdx + 1}
                          </span>
                          <span>Window:</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="time"
                              value={win.startTime}
                              onChange={(e) =>
                                handleUpdateWindow(day.dayOfWeek, winIdx, 'startTime', e.target.value)
                              }
                              className="text-xs font-mono font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer"
                            />
                          </div>

                          <span className="text-xs font-bold text-gray-400">to</span>

                          <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="time"
                              value={win.endTime}
                              onChange={(e) =>
                                handleUpdateWindow(day.dayOfWeek, winIdx, 'endTime', e.target.value)
                              }
                              className="text-xs font-mono font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="text-xs font-bold text-amber-800 bg-amber-100/60 px-2.5 py-1 rounded-md">
                          {formatTime12Hour(win.startTime)} – {formatTime12Hour(win.endTime)} IST
                        </div>

                        {day.windows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveWindow(day.dayOfWeek, winIdx)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto cursor-pointer"
                            title="Remove this window"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Temporary Blocked Periods Section (Leaves, Medical, Travel) */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
        <div>
          <h4 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-amber-600" />
            Temporary Blocked Periods & Leave
          </h4>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            Block temporary specific dates or hours (e.g. personal leaves, medical consultations, travel, concerts). These temporary blocks instantly override your weekly working windows for that specific date without deleting existing completed or upcoming sessions.
          </p>
        </div>

        {/* Add Block Form */}
        <form onSubmit={handleAddBlockedTime} className="bg-[#FAF8F5] p-5 rounded-2xl border border-gray-200 space-y-4">
          <div className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-amber-600" />
            <span>Schedule New Temporary Leave / Blocked Period</span>
          </div>

          {blockError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{blockError}</span>
            </div>
          )}

          {blockSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{blockSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Start Time (IST)</label>
              <input
                type="time"
                required
                value={blockStartTime}
                onChange={(e) => setBlockStartTime(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">End Time (IST)</label>
              <input
                type="time"
                required
                value={blockEndTime}
                onChange={(e) => setBlockEndTime(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Reason / Note</label>
              <input
                type="text"
                required
                placeholder="e.g. Doctor appointment, Concert"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAddingBlock}
              className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CalendarOff className="w-3.5 h-3.5" />
              <span>{isAddingBlock ? 'Blocking Period...' : 'Add Blocked Time'}</span>
            </button>
          </div>
        </form>

        {/* Existing Blocks List */}
        <div>
          <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500 mb-3">
            Active Blocked Periods ({blockedTimes.length})
          </h5>

          {blockedTimes.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <CalendarOff className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-600">No active temporary blocked periods</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                All scheduled working hours remain active according to your weekly configuration.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {blockedTimes.map((block) => (
                <div
                  key={block.id}
                  className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-rose-950">{block.date}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                        {formatTime12Hour(block.startTime)} – {formatTime12Hour(block.endTime)} IST
                      </span>
                    </div>
                    <p className="text-xs font-medium text-rose-900 mt-1">{block.reason}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Added by {block.createdByName || 'Faculty'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveBlockedTime(block.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    title="Remove blocked period"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
