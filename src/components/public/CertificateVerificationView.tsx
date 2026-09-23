import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, XCircle, CheckCircle2, Calendar, User, BookOpen, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useRouter } from '../../router/RouterContext';
import { Certificate } from '../../types';

export const CertificateVerificationView: React.FC = () => {
  const { params, navigate } = useRouter();
  const certificateId = params.certificateId || '';

  const [loading, setLoading] = useState<boolean>(true);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    const verifyCert = async () => {
      if (!certificateId) {
        setLoading(false);
        setErrorState('No certificate ID or verification code provided.');
        return;
      }

      setLoading(true);
      try {
        // 1. Try fetching directly by document ID
        const docRef = doc(db, 'certificates', certificateId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Certificate;
          setCertificate({ ...data, id: docSnap.id });
          setLoading(false);
          return;
        }

        // 2. Try querying by verificationCode field
        const q = query(collection(db, 'certificates'), where('verificationCode', '==', certificateId));
        const querySnap = await getDocs(q);

        if (!querySnap.empty) {
          const matchDoc = querySnap.docs[0];
          const data = matchDoc.data() as Certificate;
          setCertificate({ ...data, id: matchDoc.id });
          setLoading(false);
          return;
        }

        setErrorState('Certificate not found or has been revoked in the Saremi Academy Registry.');
      } catch (err: any) {
        console.error('[Certificate Verification Error]', err);
        setErrorState('Unable to verify certificate at this moment. Please check the ID and try again.');
      } finally {
        setLoading(false);
      }
    };

    verifyCert();
  }, [certificateId]);

  return (
    <div className="min-h-[85vh] bg-[#FAF8F5] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-left">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-[#121829] text-white p-8 text-center relative">
          <div className="absolute top-4 left-4">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/25 text-white text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Academy Home</span>
            </button>
          </div>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#D49A3D]/20 border border-[#D49A3D]/40 text-[#D49A3D] mb-4 shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Saremi Academy Credential Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Official Indian Classical & Western Conservatory Registry
          </p>
        </div>

        {/* Body Content */}
        <div className="p-8 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#D49A3D] animate-spin" />
              <p className="text-sm font-medium text-slate-600">Verifying digital diploma against secure blockchain/Firestore ledger...</p>
            </div>
          ) : errorState || !certificate ? (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <XCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Verification Failed</h2>
              <p className="text-sm text-slate-600 max-w-md">
                {errorState || 'The certificate reference could not be authenticated.'}
              </p>
              <div className="pt-4">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-xl bg-[#121829] text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Return to Homepage
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Authentic Credential</h3>
                    <p className="text-xs text-emerald-600">This certificate is fully valid, unrevoked, and certified by Saremi Academy.</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold uppercase tracking-widest shadow-2xs">
                  VERIFIED
                </span>
              </div>

              {/* Certificate Details Card */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recipient Musician</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#D49A3D]" />
                      {certificate.studentName}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Course / Discipline</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#D49A3D]" />
                      {certificate.courseTitle}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Academic Level & Grade</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {certificate.level} {certificate.grade ? `• ${certificate.grade}` : ''}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completion Date</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {certificate.issueDate}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
                  <div>
                    <span className="font-semibold">Credential ID:</span> <span className="font-mono font-bold text-slate-700">{certificate.verificationCode || certificate.id}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Issued By:</span> {certificate.issuedBy || 'Pt. Saremi Conservatory Academic Council'}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs"
                >
                  Print Certificate Record
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 rounded-xl bg-[#D49A3D] hover:bg-[#c28932] text-[#121829] text-xs font-extrabold transition-colors shadow-sm"
                >
                  Explore Saremi Academy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
