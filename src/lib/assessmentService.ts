import { collection, doc, getDoc, getDocs, setDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export interface AssessmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  courseTitle: string;
  reportPeriod: string; // e.g. 'Month 1 Assessment (Classes 1-8)'
  ratings: {
    surPitch: 'Excellent' | 'Good' | 'Needs Improvement' | 'Satisfactory';
    taalRhythm: 'Excellent' | 'Good' | 'Needs Improvement' | 'Satisfactory';
    technique: 'Excellent' | 'Good' | 'Needs Improvement' | 'Satisfactory';
    musicalUnderstanding: 'Excellent' | 'Good' | 'Needs Improvement' | 'Satisfactory';
    riyazRegularity: 'Excellent' | 'Good' | 'Needs Improvement' | 'Satisfactory';
    homeworkCompletion: 'Excellent' | 'Good' | 'Needs Improvement' | 'Satisfactory';
  };
  strengths: string;
  areasToImprove: string;
  recommendedPractice: string;
  generalRemarks: string;
  createdAt: string;
}

export async function createAssessment(params: Omit<AssessmentRecord, 'id' | 'createdAt'>): Promise<AssessmentRecord> {
  const id = `report_${params.studentId}_${Date.now()}`;
  const record: AssessmentRecord = {
    ...params,
    id,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'assessments', id), record);
  } catch (err) {
    console.warn('[Assessment Service] Save error:', err);
  }

  return record;
}

export async function getStudentAssessments(studentId: string): Promise<AssessmentRecord[]> {
  try {
    const q = query(collection(db, 'assessments'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AssessmentRecord).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    console.warn('[Assessment Service] Fetch error:', err);
    return [];
  }
}
