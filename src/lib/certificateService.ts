import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface CertificateRecord {
  id: string;
  certificateId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  completionDate: string;
  issuedAt: string;
  status: 'valid' | 'revoked';
  issuerName: string;
  qrCodeUrl?: string;
  metadata?: Record<string, any>;
}

export async function generateCertificate(params: {
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  issuerName?: string;
}): Promise<CertificateRecord> {
  const certificateId = `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();

  const record: CertificateRecord = {
    id: certificateId,
    certificateId,
    studentId: params.studentId,
    studentName: params.studentName,
    courseId: params.courseId,
    courseTitle: params.courseTitle,
    completionDate: now.split('T')[0],
    issuedAt: now,
    status: 'valid',
    issuerName: params.issuerName || 'Pandit V. Bhatkhande Faculty Board, Saremi Academy',
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/verify-certificate/' + certificateId)}`
  };

  try {
    await setDoc(doc(db, 'certificates', certificateId), record);
  } catch (err) {
    console.warn('[Certificate Service] Firestore write notice:', err);
  }

  return record;
}

export async function getCertificate(certificateId: string): Promise<CertificateRecord | null> {
  try {
    const snap = await getDoc(doc(db, 'certificates', certificateId));
    if (snap.exists()) {
      return snap.data() as CertificateRecord;
    }
  } catch (err) {
    console.warn('[Certificate Service] Read notice:', err);
  }
  return null;
}

export async function getAllCertificates(): Promise<CertificateRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'certificates'));
    return snap.docs.map(d => d.data() as CertificateRecord);
  } catch (err) {
    console.warn('[Certificate Service] GetAll notice:', err);
    return [];
  }
}

export async function revokeCertificate(certificateId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'certificates', certificateId), { status: 'revoked' });
  } catch (err) {
    console.warn('[Certificate Service] Revoke notice:', err);
  }
}
