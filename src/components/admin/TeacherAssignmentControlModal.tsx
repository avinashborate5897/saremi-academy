import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sliders,
  Users,
  Award,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Search,
  Check,
  ChevronRight,
  Info,
  Clock,
  Layers,
  Settings,
  UserCheck,
  HelpCircle
} from 'lucide-react';
import {
  TeacherProfile,
  EnrollmentRecord,
  ClassSession,
  UserProfile,
  TeacherAssignmentSettings,
  TeacherWorkloadStats,
  TeacherMatchResult
} from '../../types';
import {
  getTeacherAssignmentSettings,
  saveTeacherAssignmentSettings,
  calculateTeacherWorkloads,
  evaluateTeacherMatches,
  assignTeacherToEnrollment,
  DEFAULT_ASSIGNMENT_SETTINGS
} from '../../lib/teacherAssignmentService';
import { triggerHaptic } from '../../utils/haptics';

interface TeacherAssignmentControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherProfile[];
  enrollments: EnrollmentRecord[];
  classes?: ClassSession[];
  currentUser: UserProfile | null;
  onEnrollmentUpdated?: () => void;
  targetEnrollmentId?: string; // If opened for a specific enrollment
}

export const TeacherAssignmentControlModal: React.FC<TeacherAssignmentControlModalProps> = ({
  isOpen,
  onClose,
  teachers,
  enrollments,
  classes = [],
  currentUser,
  onEnrollmentUpdated,
  targetEnrollmentId
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'workload' | 'settings'>('match');
  const [settings, setSettings] = useState<TeacherAssignmentSettings>(DEFAULT_ASSIGNMENT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Selected Enrollment for matching
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>(
    targetEnrollmentId || (enrollments.find((e) => !e.teacherId || e.assignmentStatus === 'REASSIGNMENT_REQUIRED')?.id || enrollments[0]?.id || '')
  );

  // Computed matching results
  const [matchResults, setMatchResults] = useState<TeacherMatchResult[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Manual override custom reason
  const [customOverrideReason, setCustomOverrideReason] = useState('');
  const [manualSelectedTeacherId, setManualSelectedTeacherId] = useState<string>('');

  // Workload Matrix Map
  const workloadMap = calculateTeacherWorkloads(teachers, enrollments, classes, settings.defaultMaxStudentsPerTeacher);

  useEffect(() => {
    if (!isOpen) return;

    const loadSettings = async () => {
      setLoading(true);
      try {
        const fetched = await getTeacherAssignmentSettings();
        setSettings(fetched);
      } catch (err) {
        console.warn('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [isOpen]);

  useEffect(() => {
    if (targetEnrollmentId) {
      setSelectedEnrollmentId(targetEnrollmentId);
    }
  }, [targetEnrollmentId]);

  const selectedEnrollment = enrollments.find((e) => e.id === selectedEnrollmentId);

  // Re-compute matches when selected enrollment or settings change
  useEffect(() => {
    if (!selectedEnrollment) {
      setMatchResults([]);
      return;
    }

    const results = evaluateTeacherMatches({
      courseId: selectedEnrollment.courseId,
      level: selectedEnrollment.level,
      studentId: selectedEnrollment.studentId,
      studentHistoryTeachers: selectedEnrollment.teacherHistory?.map((h) => h.teacherId) || [],
      teachers,
      workloadMap,
      settings
    });

    setMatchResults(results);
    const topEligible = results.find((r) => r.isEligible);
    if (topEligible) {
      setManualSelectedTeacherId(topEligible.teacher.id);
    }
  }, [selectedEnrollmentId, settings, teachers.length, enrollments.length]);

  if (!isOpen) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    triggerHaptic('medium');
    try {
      const updated = await saveTeacherAssignmentSettings(settings, {
        id: currentUser?.id,
        email: currentUser?.email,
        name: currentUser?.name
      });
      setSettings(updated);
      setSettingsSuccess(true);
      triggerHaptic('success');
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      alert(err.message || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExecuteAssignment = async (teacherId?: string, isManual = false) => {
    if (!selectedEnrollmentId) return;

    const targetId = teacherId || manualSelectedTeacherId;
    if (!targetId) {
      setAssignError('Please choose a faculty mentor to assign.');
      return;
    }

    setIsAssigning(true);
    setAssignError(null);
    setAssignSuccess(null);
    triggerHaptic('medium');

    try {
      const result = await assignTeacherToEnrollment({
        enrollmentId: selectedEnrollmentId,
        teacherId: targetId,
        isManualOverride: isManual,
        reason: customOverrideReason.trim() || undefined,
        adminUser: {
          id: currentUser?.id,
          email: currentUser?.email,
          name: currentUser?.name
        },
        teachers,
        enrollments
      });

      triggerHaptic('success');
      setAssignSuccess(result.message);
      if (onEnrollmentUpdated) {
        onEnrollmentUpdated();
      }
      setTimeout(() => setAssignSuccess(null), 4000);
    } catch (err: any) {
      console.error('Assignment error:', err);
      setAssignError(err.message || 'Failed to assign faculty member.');
      triggerHaptic('warning');
    } finally {
      setIsAssigning(false);
    }
  };

  const unassignedCount = enrollments.filter(
    (e) => !e.teacherId || e.assignmentStatus === 'UNASSIGNED' || e.assignmentStatus === 'REASSIGNMENT_REQUIRED'
  ).length;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 text-left">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl relative z-10 flex flex-col max-h-[92vh] border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-slate-50/80 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                <Sliders className="w-3 h-3 text-amber-700" />
                Administrative Pedagogical Operations
              </span>
              {unassignedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                  {unassignedCount} Requiring Faculty Match
                </span>
              )}
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
              Automated & Controlled Teacher Assignment System
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Deterministic, explainable matching based on discipline, pedagogy level, faculty capacity, and student continuity.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-6 bg-white border-b border-gray-200 shrink-0 text-xs font-bold text-gray-500">
          <button
            onClick={() => setActiveTab('match')}
            className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'match' ? 'border-amber-600 text-amber-900' : 'border-transparent hover:text-gray-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Smart Match Engine ({matchResults.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('workload')}
            className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'workload' ? 'border-amber-600 text-amber-900' : 'border-transparent hover:text-gray-800'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>Faculty Capacity & Workload Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'settings' ? 'border-amber-600 text-amber-900' : 'border-transparent hover:text-gray-800'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-600" />
            <span>Assignment Engine Rules & Safety</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: SMART MATCH ENGINE */}
          {activeTab === 'match' && (
            <div className="space-y-6">
              {/* Enrollment Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-gray-700 block uppercase tracking-wider">
                  Target Student Enrollment to Match
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={selectedEnrollmentId}
                    onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                    className="p-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-white text-gray-900 focus:ring-2 focus:ring-amber-500"
                  >
                    {enrollments.map((enr) => {
                      const hasTeacher = !!enr.teacherId;
                      const statusTag = enr.assignmentStatus || (hasTeacher ? 'ACTIVE' : 'UNASSIGNED');
                      return (
                        <option key={enr.id} value={enr.id}>
                          {enr.studentName} — {enr.courseName} ({statusTag}
                          {hasTeacher ? ` • ${enr.teacherName}` : ''})
                        </option>
                      );
                    })}
                  </select>

                  {selectedEnrollment && (
                    <div className="text-xs text-gray-600 flex flex-col justify-center bg-white p-2.5 rounded-xl border border-gray-200">
                      <div>
                        Course: <strong>{selectedEnrollment.courseName}</strong> ({selectedEnrollment.level || 'Foundation'})
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Current Guru: <strong>{selectedEnrollment.teacherName || 'None (Unassigned)'}</strong> • Status:{' '}
                        <span className="font-bold text-amber-800">
                          {selectedEnrollment.assignmentStatus || 'UNASSIGNED'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Alerts */}
              {assignSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{assignSuccess}</span>
                </div>
              )}

              {assignError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{assignError}</span>
                </div>
              )}

              {/* Match Ranked List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    Ranked Faculty Recommendations (Score Breakdown)
                  </h4>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Evaluated against {teachers.length} faculty members
                  </span>
                </div>

                {matchResults.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-gray-50 border border-gray-200 text-center text-gray-400 text-xs">
                    No faculty match results found for this course criteria.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matchResults.map((result, idx) => {
                      const teacher = result.teacher;
                      const isTopMatch = idx === 0 && result.isEligible;
                      const isSelected = manualSelectedTeacherId === teacher.id;
                      const workload = workloadMap.get(teacher.id);

                      return (
                        <div
                          key={teacher.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isSelected
                              ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-400/20'
                              : result.isEligible
                              ? 'bg-white border-gray-200 hover:border-gray-300'
                              : 'bg-gray-50/80 border-gray-200 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isTopMatch
                                    ? 'bg-amber-600 text-white'
                                    : result.isEligible
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {result.totalScore}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-bold text-gray-900">{teacher.name}</h5>
                                  {teacher.teacherId && (
                                    <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                      {teacher.teacherId}
                                    </span>
                                  )}
                                  {isTopMatch && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      ★ Top Recommendation
                                    </span>
                                  )}
                                  {!result.isEligible && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                                      Ineligible
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-gray-500 mt-0.5">
                                  {teacher.specialization || 'Conservatory Faculty'} • Capacity:{' '}
                                  <strong className={workload?.isAtCapacity ? 'text-rose-600' : 'text-gray-900'}>
                                    {workload?.activeEnrollmentCount || 0}/{workload?.maxCapacity || 20} Active Students
                                  </strong>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => setManualSelectedTeacherId(teacher.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {isSelected ? 'Selected' : 'Select'}
                              </button>

                              <button
                                type="button"
                                disabled={isAssigning || !result.isEligible}
                                onClick={() => handleExecuteAssignment(teacher.id, false)}
                                className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold cursor-pointer disabled:opacity-40 transition-colors"
                              >
                                Assign Now
                              </button>
                            </div>
                          </div>

                          {/* Score breakdown metrics */}
                          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-6 gap-2 text-[10px]">
                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 text-center">
                              <span className="text-gray-400 block">Discipline</span>
                              <strong className="text-amber-800">{result.breakdown.disciplineMatch}/40</strong>
                            </div>
                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 text-center">
                              <span className="text-gray-400 block">Level</span>
                              <strong className="text-amber-800">{result.breakdown.levelMatch}/15</strong>
                            </div>
                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 text-center">
                              <span className="text-gray-400 block">Schedule</span>
                              <strong className="text-amber-800">{result.breakdown.availabilityMatch}/15</strong>
                            </div>
                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 text-center">
                              <span className="text-gray-400 block">Capacity</span>
                              <strong className="text-amber-800">{result.breakdown.capacityScore}/15</strong>
                            </div>
                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 text-center">
                              <span className="text-gray-400 block">Continuity</span>
                              <strong className="text-amber-800">{result.breakdown.continuityBonus}/15</strong>
                            </div>
                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 text-center">
                              <span className="text-gray-400 block">Distribution</span>
                              <strong className="text-amber-800">{result.breakdown.workloadBalanceBonus}/10</strong>
                            </div>
                          </div>

                          {/* Explanation notes */}
                          {result.explanationNotes.length > 0 && (
                            <div className="mt-2 text-[11px] text-gray-500 space-y-0.5">
                              {result.explanationNotes.map((note, nIdx) => (
                                <div key={nIdx} className="flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                                  <span>{note}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Manual Override Reason Box */}
              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2">
                <label className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                  Admin Explicit Note / Justification (Logged to Audit Trail)
                </label>
                <input
                  type="text"
                  value={customOverrideReason}
                  onChange={(e) => setCustomOverrideReason(e.target.value)}
                  placeholder="e.g. Student requested classical vocal guidance from Panditji directly."
                  className="w-full p-2.5 text-xs bg-white border border-amber-200 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* TAB 2: FACULTY WORKLOAD MATRIX */}
          {activeTab === 'workload' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Conservatory Faculty Capacity & Active Student Workload
                  </h4>
                  <p className="text-xs text-gray-500">
                    Real-time monitoring across all enrolled students and weekly live sessions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teachers.map((teacher) => {
                  const stats = workloadMap.get(teacher.id);
                  if (!stats) return null;

                  const isHigh = stats.capacityPercentage >= 80;
                  const isMedium = stats.capacityPercentage >= 50 && stats.capacityPercentage < 80;

                  return (
                    <div
                      key={teacher.id}
                      className="p-4 rounded-2xl border border-gray-200 bg-white shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-bold text-gray-900">{teacher.name}</h5>
                          <span className="text-[11px] text-gray-500 block">
                            {teacher.specialization || 'Faculty Mentor'}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            stats.isAtCapacity
                              ? 'bg-rose-100 text-rose-800'
                              : isHigh
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {stats.isAtCapacity ? 'At Capacity' : `${stats.availableCapacity} Seats Open`}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-700">
                          <span>Active Students</span>
                          <span>
                            {stats.activeEnrollmentCount} / {stats.maxCapacity} ({stats.capacityPercentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              stats.isAtCapacity
                                ? 'bg-rose-600'
                                : isHigh
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, stats.capacityPercentage)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100 font-medium">
                        <span>Upcoming Classes (7 days): <strong>{stats.weeklyClassesScheduled}</strong></span>
                        <span>Auto-Assign: <strong>{stats.isEligibleForAutoAssign ? 'Enabled' : 'Paused'}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ASSIGNMENT ENGINE SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs text-amber-950 space-y-1">
                <span className="font-bold block flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  Deterministic Academic Safety Policy
                </span>
                <p className="text-[11px] text-amber-800">
                  Uncontrolled automated decisions are forbidden. The engine enforces discipline matching, faculty capacity ceilings, and administrator override authority.
                </p>
              </div>

              {settingsSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Teacher assignment rules updated successfully.</span>
                </div>
              )}

              <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
                {/* Auto Assignment Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Enable Automated Faculty Assignment</h5>
                    <p className="text-[11px] text-gray-500">
                      When enabled, newly paid enrollments without teacher designation will be routed to the best pedagogical match.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoAssignmentEnabled}
                      onChange={(e) =>
                        setSettings({ ...settings, autoAssignmentEnabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {/* Default Max Students Per Teacher */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Default Maximum Students per Faculty Member</h5>
                    <p className="text-[11px] text-gray-500">
                      Prevents teacher burnout and maintains 1:1 attention quality.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={settings.defaultMaxStudentsPerTeacher}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaultMaxStudentsPerTeacher: parseInt(e.target.value, 10) || 20
                        })
                      }
                      className="w-16 p-2 rounded-xl border border-gray-300 text-xs font-bold text-center text-gray-900"
                    />
                    <span className="text-xs text-gray-500 font-bold">Students</span>
                  </div>
                </div>

                {/* Continuity Priority */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Prioritize Teacher-Student Continuity</h5>
                    <p className="text-[11px] text-gray-500">
                      Awards a 15-point bonus to faculty members who previously taught the student in earlier terms.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.prioritizeContinuity}
                      onChange={(e) =>
                        setSettings({ ...settings, prioritizeContinuity: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {/* Fixed Assignment Overrides */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Fixed Admin Assignment Overrides Auto-Engine</h5>
                    <p className="text-[11px] text-gray-500">
                      Guarantees that explicit administrator selections remain untouched by background auto-assignment.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.fixedAssignmentOverridesAuto}
                      onChange={(e) =>
                        setSettings({ ...settings, fixedAssignmentOverridesAuto: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                >
                  {savingSettings ? 'Saving Configuration...' : 'Save Assignment Policy'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500 font-medium">
            Controlled faculty routing with administrative oversight and transparent scoring.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
