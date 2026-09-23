import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface TestimonialRecord {
  id: string;
  studentName: string;
  age?: number;
  courseTitle: string;
  duration: string;
  quote: string;
  audioUrl?: string;
  videoUrl?: string;
  approved: boolean;
  orderIndex: number;
  createdAt: string;
}

export const INITIAL_TESTIMONIALS: TestimonialRecord[] = [
  {
    id: 'test_1',
    studentName: 'Rhea Sharma',
    age: 9,
    courseTitle: 'Raag Yaman & Vocal Foundation',
    duration: '2 Months',
    quote: 'Learning classical vocal with Saremi has transformed my pitch stability and swar lagav. My Guru explains every nuance with incredible patience.',
    approved: true,
    orderIndex: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'test_2',
    studentName: 'Aarav Mehta',
    age: 14,
    courseTitle: 'Sitar & Instrumental Mastery',
    duration: '4 Months',
    quote: 'The 1:1 live interactive classes and the Tanpura practice tools give me the exact feel of a traditional guru-shishya parampara online.',
    approved: true,
    orderIndex: 2,
    createdAt: new Date().toISOString()
  }
];

export async function getTestimonials(): Promise<TestimonialRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'testimonials'));
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as TestimonialRecord).sort((a, b) => a.orderIndex - b.orderIndex);
    }
  } catch (err) {
    console.warn('[Testimonial Service] Read notice:', err);
  }
  return INITIAL_TESTIMONIALS;
}

export async function saveTestimonial(record: TestimonialRecord): Promise<void> {
  try {
    await setDoc(doc(db, 'testimonials', record.id), record);
  } catch (err) {
    console.warn('[Testimonial Service] Save error:', err);
  }
}

export async function deleteTestimonial(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'testimonials', id));
  } catch (err) {
    console.warn('[Testimonial Service] Delete error:', err);
  }
}
