import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Download,
  ShieldCheck,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  subscribeToCertificates,
  saveCertificate,
  subscribeToStudents,
  recordAuditLog,
  exportToCSV
} from '../../lib/adminFirestoreService';
import { Certificate, UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminCertificatesView: React.FC = () => {
  const { user: currentAdmin, role } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);

  const [newCert, setNewCert] = useState<Partial<Certificate>>({
    studentId: '',
    studentName: '',
    courseTitle: 'Hindustani Classical Vocal',
    level: 'Foundation',
    issuedBy: 'Pt. Saremi Conservatory Academic Council',
    grade: 'Distinction'
  });

  useEffect(() => {
    const unsubCerts = subscribeToCertificates(setCertificates);
    const unsubStudents = subscribeToStudents(setStudents);
    return () => {
      unsubCerts();
      unsubStudents();
    };
  }, []);

  const filteredCerts = certificates.filter((c) =>
    c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.verificationCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const rows = filteredCerts.map((c) => ({
      CertID: c.id,
      VerificationCode: c.verificationCode,
      StudentName: c.studentName,
      Course: c.courseTitle,
      Level: c.level,
      Grade: c.grade || 'Passed',
      IssueDate: c.issueDate
    }));
    exportToCSV('saremi_issued_certificates', rows);
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.studentName || !newCert.courseTitle) return;

    const code = `SAR-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const id = `cert_${Date.now()}`;

    const certData: Certificate = {
      id,
      studentId: newCert.studentId || 'std_01',
      studentName: newCert.studentName,
      courseTitle: newCert.courseTitle,
      level: (newCert.level as any) || 'Foundation',
      issueDate: new Date().toISOString().split('T')[0],
      verificationCode: code,
      issuedBy: newCert.issuedBy || 'Pt. Saremi Conservatory Academic Council',
      grade: newCert.grade || 'Distinction',
      certificateUrl: `https://saremi.academy/verify/${code}`
    };

    await saveCertificate(certData);
    await recordAuditLog(
      {
        id: currentAdmin?.uid || 'admin',
        name: currentAdmin?.displayName || 'Admin',
        role: role || 'admin'
      },
      'Issued Graduation Certificate',
      'certificate',
      id,
      `Issued diploma certificate [${code}] to ${certData.studentName} for ${certData.courseTitle} (${certData.level})`
    );

    setShowModal(false);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative min-w-[200px] sm:min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search certificates by student, raga, verification code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Registry</span>
          </button>
          <button
            onClick={() => {
              setNewCert({
                studentId: students[0]?.id || 'std_01',
                studentName: students[0]?.name || 'Aarav Sharma',
                courseTitle: 'Hindustani Classical Vocal',
                level: 'Foundation',
                issuedBy: 'Pt. Saremi Conservatory Academic Council',
                grade: 'Distinction'
              });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Certificate</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Verification Code</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Discipline & Level</th>
                <th className="py-3.5 px-4">Award Grade</th>
                <th className="py-3.5 px-4">Issued Date</th>
                <th className="py-3.5 px-4 text-right">Certificate Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No certificates issued yet.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-[11px]">
                        {cert.verificationCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{cert.studentName}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{cert.courseTitle}</div>
                      <span className="text-[10px] text-slate-500">{cert.level} Level</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {cert.grade || 'Passed with Honors'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">{cert.issueDate}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setPreviewCert(cert)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>View Diploma</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diploma Certificate Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl text-center border-4 border-amber-400/40 relative">
            <button
              onClick={() => setPreviewCert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xs"
            >
              ✕
            </button>

            <div className="border border-amber-300/80 p-8 rounded-2xl bg-gradient-to-b from-amber-50/40 to-white space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500 text-slate-950 font-serif font-black flex items-center justify-center text-xl shadow-md">
                S
              </div>
              <div className="font-serif tracking-widest text-xs font-bold text-amber-800 uppercase">
                Saremi Academy of Classical Arts
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900">
                Certificate of Musical Excellence
              </h2>
              <p className="text-xs text-slate-500 italic">This is to proudly certify that</p>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-amber-900 underline decoration-amber-400">
                {previewCert.studentName}
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                has demonstrated rigorous commitment and mastery in{' '}
                <strong className="text-slate-900">{previewCert.courseTitle}</strong> ({previewCert.level} Curriculum) and is hereby awarded with{' '}
                <strong className="text-emerald-700">{previewCert.grade}</strong>.
              </p>

              <div className="pt-6 border-t border-amber-200/60 flex items-center justify-between text-xs text-slate-500">
                <div className="text-left">
                  <div className="font-mono text-[10px] text-slate-400">VERIFICATION ID</div>
                  <div className="font-mono font-bold text-slate-900">{previewCert.verificationCode}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[10px] text-slate-400">ISSUED ON</div>
                  <div className="font-bold text-slate-900">{previewCert.issueDate}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-lg font-bold text-slate-900">Issue Diploma Certificate</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueCertificate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Student *</label>
                <select
                  value={newCert.studentId}
                  onChange={(e) => {
                    const sel = students.find((s) => s.id === e.target.value);
                    setNewCert({
                      ...newCert,
                      studentId: e.target.value,
                      studentName: sel?.name || 'Student'
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Discipline / Course</label>
                <input
                  type="text"
                  required
                  value={newCert.courseTitle}
                  onChange={(e) => setNewCert({ ...newCert, courseTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Curriculum Level</label>
                  <select
                    value={newCert.level}
                    onChange={(e) => setNewCert({ ...newCert, level: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Foundation">Foundation</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced / Riaz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Grade / Distinction</label>
                  <select
                    value={newCert.grade}
                    onChange={(e) => setNewCert({ ...newCert, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Distinction">Distinction</option>
                    <option value="First Class Honors">First Class Honors</option>
                    <option value="Passed">Passed</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
                >
                  Generate & Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
