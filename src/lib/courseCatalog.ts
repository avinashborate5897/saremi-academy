/**
 * Saremi Academy - Authoritative Course Catalog & Pricing System
 * 
 * Single authoritative source of truth for all course details (price, duration, packages,
 * syllabus, faculty, and learning modes) derived directly from the Hero landing page & Explore Courses.
 */

import { LearningMode, SaremiPackage, OFFICIAL_PACKAGES, getAuthoritativePackage, getAuthoritativePrice } from '../data/pricingData';

export interface CoursePlanPricing {
  durationMonths: 1 | 2 | 3;
  sessionsTotal: number;
  monthlyDisplayPrice: number;
  totalPrice: number;
  savingsPercentage: number;
  discountBadge?: string;
  perSessionPrice: number;
  packageId: string;
  isBestValue?: boolean;
}

export interface CoursePackageTier {
  mode: LearningMode;
  modeLabel: string;
  sessionsPerMonth: 4 | 8;
  plans: CoursePlanPricing[];
}

export interface AuthoritativeCourseDetail {
  id: string;
  slug: string;
  name: string;
  title: string;
  instrument: string;
  category: 'vocals' | 'guitar' | 'piano' | 'tabla' | 'violin' | 'flute' | 'kids';
  categoryLabel: string;
  level: string;
  ageGroup: string;
  leadTeacher: {
    id: string;
    name: string;
    title: string;
    experience: number;
  };
  durationText: string;
  sessionLengthMinutes: number;
  sessionsPerWeek: 1 | 2;
  
  // Starting & Featured Pricing
  startingMonthlyPrice: number;
  startingTotalPrice: number;
  defaultPackageId: string;
  currency: 'INR' | 'USD';
  
  // Taglines & Descriptions
  tagline: string;
  shortDescription: string;
  fullDescription: string;
  imageUrl: string;
  iconName: string;
  
  // Learning formats allowed
  allowedLearningModes: LearningMode[];
  
  // Structured Pricing Tiers
  pricingTiers: CoursePackageTier[];
  
  // Key Features included
  features: string[];
  certificationName: string;
}

/**
 * Standard 1:1 Pricing Plans (Vocals, Guitar, Piano, Tabla, Kids)
 */
const STANDARD_1ON1_4S_PLANS: CoursePlanPricing[] = [
  {
    durationMonths: 1,
    sessionsTotal: 4,
    monthlyDisplayPrice: 2499,
    totalPrice: 2499,
    savingsPercentage: 0,
    perSessionPrice: 625,
    packageId: 'pkg-std-1-1-4s-1m'
  },
  {
    durationMonths: 2,
    sessionsTotal: 8,
    monthlyDisplayPrice: 2299,
    totalPrice: 4598,
    savingsPercentage: 10,
    discountBadge: '🔥 SAVE 10%',
    perSessionPrice: 575,
    packageId: 'pkg-std-1-1-4s-2m'
  },
  {
    durationMonths: 3,
    sessionsTotal: 12,
    monthlyDisplayPrice: 1999,
    totalPrice: 5997,
    savingsPercentage: 15,
    discountBadge: '👑 SAVE 15% • BEST VALUE',
    perSessionPrice: 500,
    packageId: 'pkg-std-1-1-4s-3m',
    isBestValue: true
  }
];

const STANDARD_1ON1_8S_PLANS: CoursePlanPricing[] = [
  {
    durationMonths: 1,
    sessionsTotal: 8,
    monthlyDisplayPrice: 4499,
    totalPrice: 4499,
    savingsPercentage: 0,
    perSessionPrice: 562,
    packageId: 'pkg-std-1-1-8s-1m'
  },
  {
    durationMonths: 2,
    sessionsTotal: 16,
    monthlyDisplayPrice: 4299,
    totalPrice: 8598,
    savingsPercentage: 10,
    discountBadge: '🔥 SAVE 10%',
    perSessionPrice: 537,
    packageId: 'pkg-std-1-1-8s-2m'
  },
  {
    durationMonths: 3,
    sessionsTotal: 24,
    monthlyDisplayPrice: 3999,
    totalPrice: 11997,
    savingsPercentage: 15,
    discountBadge: '👑 SAVE 15% • BEST VALUE',
    perSessionPrice: 500,
    packageId: 'pkg-std-1-1-8s-3m',
    isBestValue: true
  }
];

/**
 * Group Batches (Hindustani Vocals & Singing)
 */
const GROUP_8S_PLANS: CoursePlanPricing[] = [
  {
    durationMonths: 1,
    sessionsTotal: 8,
    monthlyDisplayPrice: 1899,
    totalPrice: 1899,
    savingsPercentage: 0,
    perSessionPrice: 237,
    packageId: 'pkg-grp-8s-1m'
  },
  {
    durationMonths: 2,
    sessionsTotal: 16,
    monthlyDisplayPrice: 1709,
    totalPrice: 3418,
    savingsPercentage: 10,
    discountBadge: '🔥 SAVE 10%',
    perSessionPrice: 214,
    packageId: 'pkg-grp-8s-2m'
  },
  {
    durationMonths: 3,
    sessionsTotal: 24,
    monthlyDisplayPrice: 1614,
    totalPrice: 4842,
    savingsPercentage: 15,
    discountBadge: '👑 SAVE 15% • BEST VALUE',
    perSessionPrice: 202,
    packageId: 'pkg-grp-8s-3m',
    isBestValue: true
  }
];

/**
 * Premium 1:1 Pricing Plans (Violin & Flute)
 */
const PREMIUM_1ON1_4S_PLANS: CoursePlanPricing[] = [
  {
    durationMonths: 1,
    sessionsTotal: 4,
    monthlyDisplayPrice: 2699,
    totalPrice: 2699,
    savingsPercentage: 0,
    perSessionPrice: 675,
    packageId: 'pkg-prm-1-1-4s-1m'
  },
  {
    durationMonths: 2,
    sessionsTotal: 8,
    monthlyDisplayPrice: 2429,
    totalPrice: 4858,
    savingsPercentage: 10,
    discountBadge: '🔥 SAVE 10%',
    perSessionPrice: 607,
    packageId: 'pkg-prm-1-1-4s-2m'
  },
  {
    durationMonths: 3,
    sessionsTotal: 12,
    monthlyDisplayPrice: 2299,
    totalPrice: 6897,
    savingsPercentage: 15,
    discountBadge: '👑 SAVE 15% • BEST VALUE',
    perSessionPrice: 575,
    packageId: 'pkg-prm-1-1-4s-3m',
    isBestValue: true
  }
];

const PREMIUM_1ON1_8S_PLANS: CoursePlanPricing[] = [
  {
    durationMonths: 1,
    sessionsTotal: 8,
    monthlyDisplayPrice: 4999,
    totalPrice: 4999,
    savingsPercentage: 0,
    perSessionPrice: 625,
    packageId: 'pkg-prm-1-1-8s-1m'
  },
  {
    durationMonths: 2,
    sessionsTotal: 16,
    monthlyDisplayPrice: 4499,
    totalPrice: 8998,
    savingsPercentage: 10,
    discountBadge: '🔥 SAVE 10%',
    perSessionPrice: 562,
    packageId: 'pkg-prm-1-1-8s-2m'
  },
  {
    durationMonths: 3,
    sessionsTotal: 24,
    monthlyDisplayPrice: 4249,
    totalPrice: 12747,
    savingsPercentage: 15,
    discountBadge: '👑 SAVE 15% • BEST VALUE',
    perSessionPrice: 531,
    packageId: 'pkg-prm-1-1-8s-3m',
    isBestValue: true
  }
];

/**
 * Single Authoritative Course Catalog Object
 */
export const COURSE_CATALOG: Record<string, AuthoritativeCourseDetail> = {
  'hindustani-classical-vocals': {
    id: 'c-hindustani-vocal',
    slug: 'hindustani-classical-vocals',
    name: 'Hindustani Classical Vocal & Swara Mastery',
    title: 'Hindustani Classical Vocal & Swara Mastery',
    instrument: 'Vocals',
    category: 'vocals',
    categoryLabel: 'Classical & Semi-Classical Vocals',
    level: 'Foundation to Advanced',
    ageGroup: 'Kids (6+), Teens & Adults',
    leadTeacher: {
      id: 't-sunanda',
      name: 'Vidushi Sunanda Sharma',
      title: 'Senior Exponent of Benaras & Kirana Gharana',
      experience: 22
    },
    durationText: '12 to 24 Weeks',
    sessionLengthMinutes: 45,
    sessionsPerWeek: 2,
    startingMonthlyPrice: 1899, // Group start or 2499 1:1
    startingTotalPrice: 1899,
    defaultPackageId: 'pkg-std-1-1-8s-3m', // 3 Month 24 classes ₹11,997
    currency: 'INR',
    tagline: 'Pure swara resonance, Kharaj riyaaz discipline, and systematic Raag architecture.',
    shortDescription: '1:1 authentic vocal apprenticeship under Kirana and Benaras gharana maestros. Master voice culture, taankari, and classical bandishes.',
    fullDescription: 'Immerse yourself in authentic 1:1 vocal apprenticeship under Kirana and Benaras gharana maestros. Develop deep breath anchoring, microtonal swar sthana precision, and learn foundational ragas (Yaman, Bhairav, Bilawal, Bhupali) with traditional bandishes, aalap structure, and improvisational taans.',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80',
    iconName: 'Mic',
    allowedLearningModes: ['one_to_one', 'group'],
    pricingTiers: [
      {
        mode: 'one_to_one',
        modeLabel: 'Standard 1:1 Live Mentorship',
        sessionsPerMonth: 4,
        plans: STANDARD_1ON1_4S_PLANS
      },
      {
        mode: 'one_to_one',
        modeLabel: 'Standard 1:1 Live Mentorship (Recommended)',
        sessionsPerMonth: 8,
        plans: STANDARD_1ON1_8S_PLANS
      },
      {
        mode: 'group',
        modeLabel: 'Small Group Batches (Max 4 Students)',
        sessionsPerMonth: 8,
        plans: GROUP_8S_PLANS
      }
    ],
    features: [
      'Live 1:1 or Small Group Sessions with Gharana Maestros',
      'Interactive Tanpura & Swara Pitch Studio access',
      'Weekly personalized Riyaaz assignments & voice notes',
      'Continuous intonation & layakari benchmarking',
      'Saremi Conservatory Graded Diploma in Vocal Performance'
    ],
    certificationName: 'Saremi Conservatory Graded Diploma in Hindustani Vocal Performance'
  },

  'western-classical-piano': {
    id: 'c-western-piano',
    slug: 'western-classical-piano',
    name: 'Western Classical & Contemporary Piano',
    title: 'Western Classical & Contemporary Piano',
    instrument: 'Piano / Keyboard',
    category: 'piano',
    categoryLabel: 'Western Classical & Contemporary Piano',
    level: 'Foundation to Advanced',
    ageGroup: 'Kids (6+), Teens & Adults',
    leadTeacher: {
      id: 't-julian',
      name: 'Julian Vance-Moreau',
      title: 'Royal Academy of Music Concert Pianist & Pedagogue',
      experience: 18
    },
    durationText: '12 to 24 Weeks',
    sessionLengthMinutes: 45,
    sessionsPerWeek: 2,
    startingMonthlyPrice: 2499,
    startingTotalPrice: 2499,
    defaultPackageId: 'pkg-std-1-1-8s-3m',
    currency: 'INR',
    tagline: 'Grand staff reading, hand independence, and harmonic mastery.',
    shortDescription: 'Master sight-reading, hand independence, classical sonatinas, and acoustic touch under Royal Academy pedagogy.',
    fullDescription: 'Learn the piano as an expressive orchestral instrument. Our progressive curriculum combines Russian/European posture technique, sight-reading agility, finger autonomy, and a rich repertoire spanning Bach, Mozart, Chopin, and modern neoclassical masters.',
    imageUrl: 'https://images.unsplash.com/photo-1520523839898-507127025c83?auto=format&fit=crop&w=1000&q=80',
    iconName: 'Piano',
    allowedLearningModes: ['one_to_one'],
    pricingTiers: [
      {
        mode: 'one_to_one',
        modeLabel: 'Standard 1:1 Live Mentorship',
        sessionsPerMonth: 4,
        plans: STANDARD_1ON1_4S_PLANS
      },
      {
        mode: 'one_to_one',
        modeLabel: 'Standard 1:1 Live Mentorship (Recommended)',
        sessionsPerMonth: 8,
        plans: STANDARD_1ON1_8S_PLANS
      }
    ],
    features: [
      'Tailored 1:1 Live Lessons with Conservatory Pianists',
      'Grand Staff Sight-Reading & Ear Training Tools',
      'Hanon & Czerny Bi-lateral Technique Coaching',
      'ABRSM & Trinity Exam Preparation Benchmarking',
      'Saremi Conservatory Certificate in Classical Piano Performance'
    ],
    certificationName: 'Saremi Conservatory Certificate in Classical Piano Performance'
  },

  'acoustic-classical-guitar': {
    id: 'c-acoustic-guitar',
    slug: 'acoustic-classical-guitar',
    name: 'Acoustic & Classical Guitar Mastery',
    title: 'Acoustic & Classical Guitar Mastery',
    instrument: 'Guitar',
    category: 'guitar',
    categoryLabel: 'Acoustic & Classical Guitar',
    level: 'Foundation to Advanced',
    ageGroup: 'Kids (8+), Teens & Adults',
    leadTeacher: {
      id: 't-matthew',
      name: 'Matthew Reed',
      title: 'Senior Faculty in String Instruments & Berklee Alumnus',
      experience: 14
    },
    durationText: '12 to 24 Weeks',
    sessionLengthMinutes: 45,
    sessionsPerWeek: 2,
    startingMonthlyPrice: 2499,
    startingTotalPrice: 2499,
    defaultPackageId: 'pkg-std-1-1-8s-3m',
    currency: 'INR',
    tagline: 'Fingerstyle polyphony, CAGED fretboard logic, and melodic phrasing.',
    shortDescription: 'Master fingerpicking independence, fluid barre chord transitions, percussive rhythm, and Spanish classical nylon techniques.',
    fullDescription: 'Master the acoustic guitar from fretboard anatomy to solo polyphony. Learn fingerpicking independence (thumb bass + finger melodies), fluid chord transitions, barre chords without pain, and Andalusian/classical etudes.',
    imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1000&q=80',
    iconName: 'Guitar',
    allowedLearningModes: ['one_to_one'],
    pricingTiers: [
      {
        mode: 'one_to_one',
        modeLabel: 'Standard 1:1 Live Mentorship',
        sessionsPerMonth: 4,
        plans: STANDARD_1ON1_4S_PLANS
      },
      {
        mode: 'one_to_one',
        modeLabel: 'Standard 1:1 Live Mentorship (Recommended)',
        sessionsPerMonth: 8,
        plans: STANDARD_1ON1_8S_PLANS
      }
    ],
    features: [
      'Personalized 1:1 Fingerstyle & Classical Coaching',
      'CAGED Fretboard Architecture & Chord-Melody Drills',
      'Metronome & Polyphonic Audio Feedback in Riyaaz Studio',
      'Repertoire from Classical Etudes to Modern Neo-Soul',
      'Saremi Conservatory Certificate in Acoustic Guitar Performance'
    ],
    certificationName: 'Saremi Conservatory Certificate in Acoustic Guitar Performance'
  },

  'classical-tabla-mastery': {
    id: 'c-classical-tabla',
    slug: 'classical-tabla-mastery',
    name: 'Classical Tabla & Tala Science',
    title: 'Classical Tabla & Tala Science',
    instrument: 'Tabla',
    category: 'tabla',
    categoryLabel: 'Classical Tabla & Tala Science',
    level: 'Foundation to Advanced',
    ageGroup: 'Kids (7+), Teens & Adults',
    leadTeacher: {
      id: 't-aniruddha',
      name: 'Pt. Aniruddha Mukherjee',
      title: 'Farukhabad & Benaras Gharana Master',
      experience: 25
    },
    durationText: '12 to 24 Weeks',
    sessionLengthMinutes: 45,
    sessionsPerWeek: 2,
    startingMonthlyPrice: 2499,
    startingTotalPrice: 2499,
    defaultPackageId: 'pkg-std-1-1-8s-3m',
    currency: 'INR',
    tagline: 'Benaras & Delhi gharana bols, crisp bayan modulation, and complex rhythmic mathematics.',
    shortDescription: 'Learn stroke clarity (Na, Tin, Ge, Dha, Dhin), wrist placement, Farukhabad kaidas, and solo tihai engineering.',
    fullDescription: 'Study under Pandit Aniruddha Mukherjee in the authentic Guru-Shishya tradition. Learn stroke clarity (Na, Tin, Ge, Dha, Dhin), wrist placement, Farukhabad and Benaras kaidas, peshkar, rela, and solo tihai engineering.',
    imageUrl: 'https://images.unsplash.com/photo-1541689592655-f5f52825a3b8?auto=format&fit=crop&w=1000&q=80',
    iconName: 'Drum',
    allowedLearningModes: ['one_to_one'],
    pricingTiers: [
      {
        mode: 'one_to_one',
        modeLabel: 'Standard 1:1 Live Mentorship',
        sessionsPerMonth: 4,
        plans: STANDARD_1ON1_4S_PLANS
      },
      {
        mode: 'one_to_one',
        modeLabel: 'Standard 1:1 Live Mentorship (Recommended)',
        sessionsPerMonth: 8,
        plans: STANDARD_1ON1_8S_PLANS
      }
    ],
    features: [
      'Direct 1:1 Guru-Shishya Tala & Stroke Pedagogy',
      'High-Definition Acoustic Bayan Bass Pressure Guidance',
      'Teentaal, Keherwa, Dadra & Rupak Solo Repertoire',
      'Accompaniment training with Classical Vocal & Sitar tracks',
      'Saremi Conservatory Diploma in Classical Tala & Percussion'
    ],
    certificationName: 'Saremi Conservatory Diploma in Classical Tala & Percussion'
  },

  'violin-strings-mastery': {
    id: 'c-violin-strings',
    slug: 'violin-strings-mastery',
    name: 'Carnatic & Western Classical Violin',
    title: 'Carnatic & Western Classical Violin',
    instrument: 'Violin',
    category: 'violin',
    categoryLabel: 'Carnatic & Western Classical Violin',
    level: 'Foundation to Advanced',
    ageGroup: 'Kids (8+), Teens & Adults',
    leadTeacher: {
      id: 't-vidya',
      name: 'Vidwan K. R. Ramanathan',
      title: 'Senior Exponent of Carnatic & Western Strings',
      experience: 20
    },
    durationText: '12 to 24 Weeks',
    sessionLengthMinutes: 45,
    sessionsPerWeek: 2,
    startingMonthlyPrice: 2699,
    startingTotalPrice: 2699,
    defaultPackageId: 'pkg-prm-1-1-8s-3m',
    currency: 'INR',
    tagline: 'Bowing mechanics, microtonal gamakas, and immaculate pitch intonation.',
    shortDescription: 'Master smooth bow control, flawless posture, microtonal nuances, and emotive melodic expression on the violin.',
    fullDescription: 'Study under senior violin maestros. Develop proper chin rest posture, bow pressure mechanics, smooth string transitions, and learn classical compositions with authentic gamaka articulation and dynamic expression.',
    imageUrl: 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&w=1000&q=80',
    iconName: 'Music',
    allowedLearningModes: ['premium_one_to_one'],
    pricingTiers: [
      {
        mode: 'premium_one_to_one',
        modeLabel: 'Premium Maestro 1:1 (4 Sessions/Mo)',
        sessionsPerMonth: 4,
        plans: PREMIUM_1ON1_4S_PLANS
      },
      {
        mode: 'premium_one_to_one',
        modeLabel: 'Premium Maestro 1:1 (8 Sessions/Mo • Recommended)',
        sessionsPerMonth: 8,
        plans: PREMIUM_1ON1_8S_PLANS
      }
    ],
    features: [
      '1:1 Live Mentorship with Senior Gharana / Carnatic Violinists',
      'Real-time Bowing & Intonation Visualizer in Practice Studio',
      'Microtonal Gamaka & Shruthi Stabilization Drills',
      'Solo Repertoire & Trinity / Conservatory Benchmarking',
      'Saremi Conservatory Diploma in Classical Violin Performance'
    ],
    certificationName: 'Saremi Conservatory Diploma in Classical Violin Performance'
  },

  'bansuri-flute-mastery': {
    id: 'c-bansuri-flute',
    slug: 'bansuri-flute-mastery',
    name: 'Bansuri & Western Flute Mastery',
    title: 'Bansuri & Western Flute Mastery',
    instrument: 'Flute / Bansuri',
    category: 'flute',
    categoryLabel: 'Bansuri & Western Flute Mastery',
    level: 'Foundation to Advanced',
    ageGroup: 'Kids (8+), Teens & Adults',
    leadTeacher: {
      id: 't-hariprasad',
      name: 'Pandit R. N. Deshpande',
      title: 'Maihar Gharana Bansuri Maestro',
      experience: 23
    },
    durationText: '12 to 24 Weeks',
    sessionLengthMinutes: 45,
    sessionsPerWeek: 2,
    startingMonthlyPrice: 2699,
    startingTotalPrice: 2699,
    defaultPackageId: 'pkg-prm-1-1-8s-3m',
    currency: 'INR',
    tagline: 'Blow angle ergonomics, breath support, meend glides, and raga improvisation.',
    shortDescription: 'Learn gentle breath control, pure tone generation, intricate meend glides, and soothing classical melodies.',
    fullDescription: 'Experience the serene acoustic beauty of the bamboo flute. Master embouchure placement, circular breathing fundamentals, deep resonance on bass bansuris, and full classical raga development.',
    imageUrl: 'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=1000&q=80',
    iconName: 'Wind',
    allowedLearningModes: ['premium_one_to_one'],
    pricingTiers: [
      {
        mode: 'premium_one_to_one',
        modeLabel: 'Premium Maestro 1:1 (4 Sessions/Mo)',
        sessionsPerMonth: 4,
        plans: PREMIUM_1ON1_4S_PLANS
      },
      {
        mode: 'premium_one_to_one',
        modeLabel: 'Premium Maestro 1:1 (8 Sessions/Mo • Recommended)',
        sessionsPerMonth: 8,
        plans: PREMIUM_1ON1_8S_PLANS
      }
    ],
    features: [
      '1:1 Direct Apprenticeship with Maihar Gharana Flute Masters',
      'Acoustic Embouchure & Tone Centering Coaching',
      'Meend Glides, Murkis, and Gamak Articulation',
      'Dedicated Tanpura & Drone Practice Studio Suite',
      'Saremi Conservatory Certificate in Classical Woodwinds'
    ],
    certificationName: 'Saremi Conservatory Certificate in Classical Woodwinds'
  },

  'kids-music-explorer': {
    id: 'c-kids-explorer',
    slug: 'kids-music-explorer',
    name: 'Kids Music Explorer & Ear Training',
    title: 'Kids Music Explorer & Ear Training',
    instrument: 'Voice & Foundational Pitch',
    category: 'kids',
    categoryLabel: 'Early Childhood Music Pedagogy',
    level: 'Foundation',
    ageGroup: 'Kids (5-12 Years)',
    leadTeacher: {
      id: 't-ananya',
      name: 'Ananya Iyer',
      title: 'Director of Early Childhood Pedagogy & Kodály Specialist',
      experience: 11
    },
    durationText: '12 Weeks',
    sessionLengthMinutes: 35,
    sessionsPerWeek: 1,
    startingMonthlyPrice: 2499,
    startingTotalPrice: 2499,
    defaultPackageId: 'pkg-std-1-1-4s-3m',
    currency: 'INR',
    tagline: 'Playful ear training, swara stories, and musical joy for young minds.',
    shortDescription: 'Interactive 1:1 sessions combining Kodály ear training, animal swara stories, and joyful singing for ages 5-12.',
    fullDescription: 'Designed specifically for young minds (ages 5 to 12). Using Kodály and Orff principles infused with joyful Indian swara storytelling, children develop perfect pitch awareness, rhythmic balance, and natural vocal poise through interactive 1:1 sessions.',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
    iconName: 'Sparkles',
    allowedLearningModes: ['one_to_one'],
    pricingTiers: [
      {
        mode: 'one_to_one',
        modeLabel: 'Standard 1:1 Live Mentorship',
        sessionsPerMonth: 4,
        plans: STANDARD_1ON1_4S_PLANS
      },
      {
        mode: 'one_to_one',
        modeLabel: 'Standard 1:1 Live Mentorship (2x/week)',
        sessionsPerMonth: 8,
        plans: STANDARD_1ON1_8S_PLANS
      }
    ],
    features: [
      'Playful 1:1 Child Pedagogy with Certified Educators',
      'Animal Swara Character Stories & Ear Training Games',
      'Rhythm clapping and solfège hand sign games',
      'Weekly progress audio clips for parents',
      'Saremi Young Virtuoso Certificate of Music Exploration'
    ],
    certificationName: 'Saremi Young Virtuoso Certificate of Music Exploration'
  }
};

/**
 * Array of all courses for listings and iterators
 */
export const COURSE_LIST: AuthoritativeCourseDetail[] = Object.values(COURSE_CATALOG);

/**
 * Find course detail by slug or ID
 */
export function getCourseBySlug(slugOrId?: string): AuthoritativeCourseDetail {
  if (!slugOrId) return COURSE_CATALOG['hindustani-classical-vocals'];

  const normalized = slugOrId.toLowerCase().trim();

  // Direct key lookup
  if (COURSE_CATALOG[normalized]) {
    return COURSE_CATALOG[normalized];
  }

  // Find by ID or partial slug match
  const found = COURSE_LIST.find(
    (c) =>
      c.slug.toLowerCase() === normalized ||
      c.id.toLowerCase() === normalized ||
      normalized.includes(c.slug.toLowerCase()) ||
      normalized.includes(c.category.toLowerCase()) ||
      (normalized.includes('singing') && c.category === 'vocals') ||
      (normalized.includes('guitar') && c.category === 'guitar') ||
      (normalized.includes('piano') && c.category === 'piano') ||
      (normalized.includes('keyboard') && c.category === 'piano') ||
      (normalized.includes('tabla') && c.category === 'tabla') ||
      (normalized.includes('violin') && c.category === 'violin') ||
      (normalized.includes('flute') && c.category === 'flute') ||
      (normalized.includes('kids') && c.category === 'kids')
  );

  return found || COURSE_CATALOG['hindustani-classical-vocals'];
}

/**
 * Find matching plan for course with learning mode, sessions, and duration
 */
export function getCoursePricingPlan(
  slugOrId: string,
  mode: LearningMode = 'one_to_one',
  sessionsPerMonth: 4 | 8 = 8,
  durationMonths: 1 | 2 | 3 = 3
): CoursePlanPricing {
  const course = getCourseBySlug(slugOrId);
  const tier = course.pricingTiers.find(
    (t) => t.mode === mode && t.sessionsPerMonth === sessionsPerMonth
  ) || course.pricingTiers[0];

  const plan = tier.plans.find((p) => p.durationMonths === durationMonths) || tier.plans[tier.plans.length - 1];
  return plan;
}

/**
 * Format currency price
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Re-export underlying package functions
 */
export { getAuthoritativePackage, getAuthoritativePrice, OFFICIAL_PACKAGES };
