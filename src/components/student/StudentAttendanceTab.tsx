import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Award, 
  ShieldCheck,
  User,
  ArrowUpRight,
  PlusCircle
} from 'lucide-react';
import { UserProfile, ClassSession } from '../../types';
import { useRouter } from '../../router/RouterContext';

interface StudentAttendanceTabProps {
  profile: UserProfile | null;
  classes?: ClassSession[];
}

export const StudentAttendanceTab: React.FC<StudentAttendanceTabProps> = ({ profile, classes = [] }) => {
  const { navigate } = useRouter();

  // Extract attendance from profile or synthesize from real classes
  const profileAttendance = Array.isArray(profile?.attendance) ? profile.attendance : [];
  
  // If profile.attendance is empty, derive from any completed/missed/rescheduled real classes
  const derivedAttendance = (profileAttendance.length === 0 && Array.isArray(classes))
    ? classes
        .filter(c => c.status === 'completed' || c.status === 'missed' || c.status === 'cancelled' || c.status === 'rescheduled' || c.attendanceStatus)
        .map((c, idx) => {
          const status: 'Present' | 'Absent' | 'Rescheduled' | 'Excused' = 
            c.attendanceStatus === 'Present' || c.status === 'completed' 
              ? 'Present' 
              : c.attendanceStatus === 'Absent' || c.status === 'missed' || c.status === 'absent' 
              ? 'Absent' 
              : 'Rescheduled';
          
          return {
            classId: c.id,
            sessionNumber: c.sessionNumber || (idx + 1),
            date: c.date || (c.scheduledAt ? new Date(c.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Session Date'),
            time: c.time || 'Class Time',
            status,
            topic: c.topic || c.courseTitle || 'Classical Mentorship Class',
            teacherName: c.teacherName || 'Assigned Guru',
            teacherFeedback: c.teacherNotes || c.attendanceNotes
          };
        })
    : profileAttendance;

  const attendanceRecords = derivedAttendance;

  const presentCount = attendanceRecords.filter((r) => r.status === 'Present').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'Absent').length;
  const rescheduledCount = attendanceRecords.filter((r) => r.status === 'Rescheduled' || r.status === 'Excused').length;
  const totalTracked = attendanceRecords.length;
  const attendancePercentage = totalTracked > 0 
    ? Math.round((presentCount / (totalTracked - rescheduledCount || 1)) * 100) 
    : 100;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          Academic Record
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">Attendance & Punctuality</h2>
        <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
          Official session attendance log validated by faculty mentors.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attendance Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-black text-emerald-600">
              {attendancePercentage}%
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1">
            {totalTracked === 0 ? 'Initial Standing' : attendancePercentage >= 90 ? 'Excellent Discipline' : 'Needs Regularity'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Classes Attended</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl sm:text-4xl font-black text-gray-900">
              {presentCount}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-medium mt-1">Present & Verified</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rescheduled</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl sm:text-4xl font-black text-amber-600">
              {rescheduledCount}
            </span>
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1">With Prior Notice</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Missed / Absent</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl sm:text-4xl font-black text-gray-400">
              {absentCount}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-medium mt-1">{absentCount} Unexcused Misses</span>
        </div>
      </div>

      {/* Detailed Chronological Attendance Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            Class-by-Class Attendance Ledger
          </h3>
          <span className="text-xs font-mono font-bold text-gray-400">
            {attendanceRecords.length} Total Logs
          </span>
        </div>

        {attendanceRecords.length === 0 ? (
          <div className="py-12 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7 text-emerald-600" />
            </div>
            <h4 className="font-serif font-bold text-lg text-gray-900 mb-1">
              No Attendance Records Yet
            </h4>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Your session logs, punctuality metrics, and teacher feedback will automatically record here after your first completed class.
            </p>
            <button
              onClick={() => navigate('/booking')}
              className="px-6 py-2.5 bg-gray-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-black transition-colors cursor-pointer shadow-md inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Schedule A Class</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {attendanceRecords.map((rec, idx) => (
              <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    rec.status === 'Present'
                      ? 'bg-emerald-100 text-emerald-700'
                      : rec.status === 'Rescheduled'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {rec.status === 'Present' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : rec.status === 'Rescheduled' ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-gray-900">
                        Session #{rec.sessionNumber}: {rec.topic}
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>{rec.date}</span>
                      <span>•</span>
                      <span>{rec.time}</span>
                      <span>•</span>
                      <span>Mentor: <strong className="text-gray-700">{rec.teacherName}</strong></span>
                    </div>
                    {rec.teacherFeedback && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        Note: "{rec.teacherFeedback}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    rec.status === 'Present'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : rec.status === 'Rescheduled'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {rec.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
