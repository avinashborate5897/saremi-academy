import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

export interface RiyazSessionRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  instrument: string; // e.g. 'Tanpura', 'Vocal Swar', 'Harmonium'
  notes?: string;
  createdAt: string;
}

export async function logRiyazSession(params: {
  studentId: string;
  durationMinutes: number;
  instrument: string;
  notes?: string;
}): Promise<void> {
  const dateStr = new Date().toISOString().split('T')[0];
  const recordId = `riyaz_${params.studentId}_${Date.now()}`;
  
  const record: RiyazSessionRecord = {
    id: recordId,
    studentId: params.studentId,
    date: dateStr,
    durationMinutes: params.durationMinutes,
    instrument: params.instrument || 'Tanpura & Vocal Swar',
    notes: params.notes || '',
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'riyaz_sessions', recordId), record);
  } catch (err) {
    console.warn('[Riyaz Service] Log error:', err);
  }
}

export async function getStudentRiyazHistory(studentId: string): Promise<RiyazSessionRecord[]> {
  try {
    const q = query(
      collection(db, 'riyaz_sessions'),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as RiyazSessionRecord);
  } catch (err) {
    // Fallback without orderBy if index is building
    try {
      const fallbackQ = query(collection(db, 'riyaz_sessions'), where('studentId', '==', studentId));
      const snap = await getDocs(fallbackQ);
      return snap.docs.map(d => d.data() as RiyazSessionRecord).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (fallbackErr) {
      console.warn('[Riyaz Service] Fetch notice:', fallbackErr);
      return [];
    }
  }
}

export function calculateRiyazStreak(sessions: RiyazSessionRecord[]): { streak: number; weeklyMinutes: number; historyMap: Record<string, boolean> } {
  const historyMap: Record<string, boolean> = {};
  let weeklyMinutes = 0;
  
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  sessions.forEach(s => {
    historyMap[s.date] = true;
    const sessionDate = new Date(s.date);
    if (sessionDate >= oneWeekAgo) {
      weeklyMinutes += (s.durationMinutes || 0);
    }
  });

  // Calculate consecutive streak going backwards from today
  let streak = 0;
  let d = new Date();
  for (let i = 0; i < 30; i++) {
    const dateStr = d.toISOString().split('T')[0];
    if (historyMap[dateStr]) {
      streak++;
    } else if (i > 0) {
      // Allow today to be incomplete without breaking streak if yesterday was practiced
      break;
    }
    d.setDate(d.getDate() - 1);
  }

  return { streak: Math.max(streak, sessions.length > 0 ? 1 : 0), weeklyMinutes, historyMap };
}
