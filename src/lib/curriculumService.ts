import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface CurriculumLesson {
  id: string;
  title: string;
  description?: string;
  durationMins?: number;
  status?: 'completed' | 'in_progress' | 'locked';
}

export interface CurriculumModule {
  id: string;
  courseId: string;
  moduleNumber: number;
  title: string;
  subtitle: string;
  status: 'completed' | 'in_progress' | 'locked';
  progressPercentage: number;
  lessons: CurriculumLesson[];
}

export const DEFAULT_CURRICULUM: CurriculumModule[] = [
  {
    id: 'mod_1',
    courseId: 'hindustani_vocal',
    moduleNumber: 1,
    title: 'Swar & Alankar Foundation',
    subtitle: 'Basic Shuddh and Komal Swar exercises, Voice Placements & Basic Alankars',
    status: 'completed',
    progressPercentage: 100,
    lessons: [
      { id: 'l_1_1', title: 'Introduction to Sapta Swar (Sa Re Ga Ma Pa Dha Ni)', durationMins: 45, status: 'completed' },
      { id: 'l_1_2', title: 'Basic Alankar Patterns (Palta 1 to 5)', durationMins: 45, status: 'completed' },
      { id: 'l_1_3', title: 'Breathing and Voice Throw Mechanics', durationMins: 45, status: 'completed' }
    ]
  },
  {
    id: 'mod_2',
    courseId: 'hindustani_vocal',
    moduleNumber: 2,
    title: 'Raag Yaman & Vilambit Bandish',
    subtitle: 'Introduction to Raag Yaman, Pakad, Aaroh-Avroh, and Chhota Khayal',
    status: 'in_progress',
    progressPercentage: 45,
    lessons: [
      { id: 'l_2_1', title: 'Raag Yaman Swaroop & Chalan', durationMins: 45, status: 'completed' },
      { id: 'l_2_2', title: 'Vilambit Bandish in Teental ("Eri Aali Piya Bin")', durationMins: 45, status: 'in_progress' },
      { id: 'l_2_3', title: 'Taan Practice in Raag Yaman', durationMins: 45, status: 'locked' }
    ]
  },
  {
    id: 'mod_3',
    courseId: 'hindustani_vocal',
    moduleNumber: 3,
    title: 'Aalap, Taan & Layakari Mastery',
    subtitle: 'Advanced Meend, Gamak, Bol-Taan and Laya variations',
    status: 'locked',
    progressPercentage: 0,
    lessons: [
      { id: 'l_3_1', title: 'Meend and Andolan Techniques', durationMins: 45, status: 'locked' },
      { id: 'l_3_2', title: 'Fast Taans and Layakari (Dugun & Chaugun)', durationMins: 45, status: 'locked' }
    ]
  },
  {
    id: 'mod_4',
    courseId: 'hindustani_vocal',
    moduleNumber: 4,
    title: 'Concert Performance & Stage Presentation',
    subtitle: 'Complete recital structure: Khayal, Tarana, Bhajan, and Stage poise',
    status: 'locked',
    progressPercentage: 0,
    lessons: [
      { id: 'l_4_1', title: 'Building a 15-Minute Classical Recital', durationMins: 60, status: 'locked' },
      { id: 'l_4_2', title: 'Final Recital Evaluation & Certification', durationMins: 60, status: 'locked' }
    ]
  }
];

export async function getCurriculumModules(courseId: string = 'hindustani_vocal'): Promise<CurriculumModule[]> {
  try {
    const snap = await getDocs(collection(db, 'curriculum_modules'));
    if (!snap.empty) {
      const items = snap.docs.map(d => d.data() as CurriculumModule).filter(m => m.courseId === courseId);
      if (items.length > 0) {
        return items.sort((a, b) => a.moduleNumber - b.moduleNumber);
      }
    }
  } catch (err) {
    console.warn('[Curriculum Service] Read notice:', err);
  }
  return DEFAULT_CURRICULUM;
}

export async function saveCurriculumModule(module: CurriculumModule): Promise<void> {
  try {
    await setDoc(doc(db, 'curriculum_modules', module.id), module);
  } catch (err) {
    console.warn('[Curriculum Service] Save error:', err);
  }
}
