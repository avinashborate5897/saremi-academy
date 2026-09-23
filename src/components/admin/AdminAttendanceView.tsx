import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Download, AlertTriangle, CheckCircle2, UserX, Clock, Edit2 } from 'lucide-react';
import { SaremiCard, SaremiButton, SaremiBadge, SaremiInput, SaremiEmptyState } from '../common/SaremiUI';
import { subscribeToLiveClasses } from '../../lib/adminFirestoreService';
import { recordLiveClassAttendance } from '../../lib/academyWorkflowService';
import { ClassSession } from '../../types';

export const AdminAttendanceView: React.FC = () => {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const unsub = subscribeToLiveClasses(setClasses);
    return () => unsub();
  }, []);

  const handleUpdateAttendance = async (cls: ClassSession, attendanceStatus: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    try {
      await recordLiveClassAttendance({
        classId: cls.id,
        studentId: cls.studentId,
        studentName: cls.studentName,
        teacherId: cls.teacherId,
        teacherName: cls.teacherName,
        courseTitle: cls.courseTitle,
        enrollmentId: cls.enrollmentId,
        program: cls.program,
        status: attendanceStatus,
        lessonNotes: cls.lessonNotes || 'Admin corrected attendance record.',
        sessionNumber: cls.sessionNumber
      });
    } catch (e) {
      console.error(e);
    }
  };

  const pastClasses = classes.filter(c => new Date(c.scheduledAt) < new Date());
  
  const filteredClasses = pastClasses.filter(c => {
    const matchSearch = c.studentName.toLowerCase().includes(search.toLowerCase()) || 
                        c.teacherName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || 
                        (filterStatus === 'missing' && !c.attendanceStatus) ||
                        (filterStatus === 'present' && c.attendanceStatus === 'Present') ||
                        (filterStatus === 'absent' && c.attendanceStatus === 'Absent');
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">Attendance Log</h2>
          <p className="text-xs text-slate-500">Monitor and correct class attendance for all sessions.</p>
        </div>
        <SaremiButton variant="outline" leftIcon={<Download className="w-4 h-4" />}>
          Export Logs
        </SaremiButton>
      </div>

      <SaremiCard className="p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by student or teacher name..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="missing">Missing Attendance</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
      </SaremiCard>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Guru</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Attendance</th>
                <th className="px-6 py-4">Correct</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs">
                    <div className="font-bold text-slate-900">{new Date(cls.scheduledAt).toLocaleDateString()}</div>
                    <div className="text-slate-500">{new Date(cls.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{cls.studentName}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{cls.teacherName}</td>
                  <td className="px-6 py-4 text-slate-600 text-xs">{cls.courseTitle}</td>
                  <td className="px-6 py-4">
                    {!cls.attendanceStatus ? (
                      <SaremiBadge variant="amber">Pending</SaremiBadge>
                    ) : (
                      <SaremiBadge variant={cls.attendanceStatus === 'Present' ? 'emerald' : cls.attendanceStatus === 'Late' ? 'amber' : 'rose'}>
                        {cls.attendanceStatus}
                      </SaremiBadge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer text-slate-700"
                      value={cls.attendanceStatus || ''}
                      onChange={(e) => handleUpdateAttendance(cls, e.target.value as any)}
                    >
                      <option value="" disabled>Update...</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                      <option value="Excused">Excused</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filteredClasses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8">
                    <SaremiEmptyState 
                      icon="📝"
                      title="No past classes found"
                      description="There are no classes requiring attendance tracking matching your filters."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
