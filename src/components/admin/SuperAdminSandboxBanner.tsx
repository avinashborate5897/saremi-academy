import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  provisionSandboxTestEnvironment, 
  TEST_ADMIN_EMAIL, 
  TEST_TEACHER_EMAIL, 
  TEST_STUDENT_EMAIL,
  TEST_PASSWORD_ADMIN,
  TEST_PASSWORD_TEACHER,
  TEST_PASSWORD_STUDENT
} from '../../lib/testSandboxService';
import { 
  FlaskConical, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  Calendar, 
  ShieldCheck, 
  GraduationCap, 
  Music,
  ExternalLink
} from 'lucide-react';

export const SuperAdminSandboxBanner: React.FC = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [provisionedData, setProvisionedData] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Strictly gate to authenticated Super Admin account only
  if (!user || user.email !== 'avinashborate5897@gmail.com') {
    return null;
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleProvision = async () => {
    setErrorMsg(null);
    setIsRunning(true);
    setProgressMsg('Initiating sandbox provisioning...');

    try {
      const result = await provisionSandboxTestEnvironment((step, _pct) => {
        setProgressMsg(step);
      });
      setProvisionedData(result);
    } catch (err: any) {
      console.error('Sandbox provisioning failure:', err);
      setErrorMsg(err.message || 'Failed to provision sandbox environment.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white border-2 border-amber-500/40 shadow-xl text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold mb-1.5 border border-amber-500/30">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>SUPER ADMIN SANDBOX CONTROL</span>
          </div>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-amber-100 flex items-center gap-2">
            Isolated End-to-End Test Environment
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
            Provision dedicated, isolated test accounts for <strong>Admin</strong>, <strong>Teacher</strong>, and <strong>Student</strong> alongside an enrolled Hindustani Classical Vocal class. All records are tagged with <code className="text-amber-300 bg-amber-950/60 px-1 py-0.5 rounded">isTestAccount: true</code> to keep production data untouched.
          </p>
        </div>

        {!provisionedData && (
          <div className="shrink-0">
            <button
              onClick={handleProvision}
              disabled={isRunning}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Provisioning Sandbox...</span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  <span>Provision Sandbox Accounts</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Real-time Status / Progress */}
      {isRunning && (
        <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-200">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
          <span>{progressMsg}</span>
        </div>
      )}

      {/* Error Display */}
      {errorMsg && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Provisioning Interrupted:</p>
            <p className="text-rose-300 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Success Output & Credentials Table */}
      {provisionedData && (
        <div className="mt-5 pt-4 border-t border-slate-700/80 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sandbox Test Accounts & Scheduled 1:1 Class Successfully Ready!</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/60">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Test Email</th>
                  <th className="py-2.5 px-3">Password</th>
                  <th className="py-2.5 px-3">Portal URL</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                <tr className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-3 font-sans font-semibold text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-200">{TEST_ADMIN_EMAIL}</td>
                  <td className="py-2.5 px-3 text-amber-200 font-bold">{TEST_PASSWORD_ADMIN}</td>
                  <td className="py-2.5 px-3 text-indigo-300">/admin</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleCopy(`${TEST_ADMIN_EMAIL}\t${TEST_PASSWORD_ADMIN}`, 'admin')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'admin' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-3 font-sans font-semibold text-purple-300 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5" />
                    <span>Teacher</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-200">{TEST_TEACHER_EMAIL}</td>
                  <td className="py-2.5 px-3 text-amber-200 font-bold">{TEST_PASSWORD_TEACHER}</td>
                  <td className="py-2.5 px-3 text-indigo-300">/teacher-app</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleCopy(`${TEST_TEACHER_EMAIL}\t${TEST_PASSWORD_TEACHER}`, 'teacher')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'teacher' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-3 font-sans font-semibold text-emerald-300 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Student</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-200">{TEST_STUDENT_EMAIL}</td>
                  <td className="py-2.5 px-3 text-amber-200 font-bold">{TEST_PASSWORD_STUDENT}</td>
                  <td className="py-2.5 px-3 text-indigo-300">/app</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleCopy(`${TEST_STUDENT_EMAIL}\t${TEST_PASSWORD_STUDENT}`, 'student')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'student' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Test Class Meta */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-white">Scheduled 1:1 Test Session:</span>{' '}
                <span className="text-amber-200">{provisionedData.classSession.topic}</span>
                <span className="text-slate-400 block sm:inline sm:ml-2">({provisionedData.classSession.scheduledAt})</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 shrink-0">
              Classroom: <code className="text-amber-300 font-mono">1:1 Agora Video Ready</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
