export interface CourseItem {
  id: string;
  slug: string;
  title: string;
  category: 'vocals' | 'piano' | 'guitar' | 'tabla' | 'kids';
  tagline: string;
  description: string;
  level: string;
  ageGroup: string;
  sessionsCount: number;
  durationMins: number;
  priceINR: number;
  priceUSD: number;
  image: string;
  teacherName: string;
  teacherTitle: string;
  teacherImage: string;
  curriculum: {
    pillar: string;
    topics: string[];
  }[];
  outcomes: string[];
}

export interface TeacherItem {
  id: string;
  name: string;
  discipline: string;
  category: 'vocals' | 'piano' | 'guitar' | 'tabla';
  experienceYears: number;
  title: string;
  tradition: string; // e.g. Kirana Gharana, Benaras, Royal Conservatory
  bio: string;
  image: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  audioSampleTitle?: string;
  availableSlots: string[];
}

export interface MasterclassItem {
  id: string;
  title: string;
  maestro: string;
  maestroTitle: string;
  instrument: string;
  date: string;
  time: string;
  duration: string;
  feeINR: number;
  status: 'upcoming' | 'sold_out' | 'archived' | 'live' | 'recorded';
  description: string;
  topics: string[];
  image: string;
}

export interface EventItem {
  id: string;
  title: string;
  category: 'Annual Recital' | 'Maestro Concert' | 'Student Showcase' | 'Audition';
  date: string;
  venue: string;
  description: string;
  status: 'Registration Open' | 'Live Stream' | 'Completed';
  image: string;
}

export interface BlogPostItem {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  content: string[];
  image: string;
}

export interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  location: string;
  course: string;
  quote: string;
  rating: number;
  avatar: string;
  durationStudying: string;
}

// -------------------------------------------------------------
// COURSES REPOSITORY
// -------------------------------------------------------------
export const ACADEMY_COURSES: CourseItem[] = [
  {
    id: 'c-hindustani-vocal',
    slug: 'hindustani-classical-vocals',
    title: 'Hindustani Classical Vocal',
    category: 'vocals',
    tagline: 'Pure swara resonance, Kharaj riyaaz discipline, and systematic Raag architecture.',
    description: 'Immerse yourself in authentic 1:1 vocal apprenticeship under Kirana and Benaras gharana maestros. Develop deep breath anchoring, microtonal swar sthana precision, and learn foundational ragas (Yaman, Bhairav, Bilawal, Bhupali) with traditional bandishes and improvisational taans.',
    level: 'Beginner to Advanced',
    ageGroup: 'Kids (6+), Teens & Adults',
    sessionsCount: 16,
    durationMins: 45,
    priceINR: 12499,
    priceUSD: 160,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80',
    teacherName: 'Vidushi Sunanda Sharma',
    teacherTitle: 'Disciple of Padma Vibhushan Girija Devi',
    teacherImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
    curriculum: [
      {
        pillar: 'Pillar 1: Sur & Swara Precision',
        topics: [
          'Vocal cord relaxation, diaphragmatic breathing & posture',
          'Kharaj riyaaz (lower octave exploration down to Mandra Saptak)',
          'Solfège Swara system & microtonal micro-slides (Meend)',
          'Swar matching with acoustic Tanpura drone'
        ]
      },
      {
        pillar: 'Pillar 2: Laya & Tala Science',
        topics: [
          'Teentaal (16 beats) clapping, khali-taali cycles, and the Som count',
          'Keherwa (8 beats) & Dadra (6 beats) laya patterns',
          'Layakari drills: Thah, Dugun, and Chaugun vocalization',
          'Tihai construction and rhythmic closures'
        ]
      },
      {
        pillar: 'Pillar 3: Raag Repertoire & Bandish',
        topics: [
          'Raag Yaman: Aroha, Avroha, Pakad, Vadi & Samvadi swaras',
          'Traditional Chhota Khayal compositions in Madhyalaya',
          'Vilambit bandish phrasing & bol-alap architecture',
          'Seasonal raags: Megh, Desh, and Basant introductions'
        ]
      },
      {
        pillar: 'Pillar 4: Manodharma (Improvisation)',
        topics: [
          'Bol-taans & sargam pattern variations',
          'Aalap progression from Mandra to Tara Saptak',
          'Stage posture, microphone presence & concert psychology',
          'Saremi Conservatory Level 1 Certification assessment'
        ]
      }
    ],
    outcomes: [
      'Sing in absolute tune across 2.5 octaves with steady Tanpura resonance',
      'Perform complete Khayal presentations with aalap, bandish, and sargam taans',
      'Decode complex rhythmic cycles and land accurately on the Som',
      'Attain Saremi Graded Vocal Conservatory Certification'
    ]
  },
  {
    id: 'c-western-piano',
    slug: 'western-classical-piano',
    title: 'Western Classical & Modern Piano',
    category: 'piano',
    tagline: 'Ergonomic hand poise, grand staff reading, and expressive dynamic interpretation.',
    description: 'Master the keys from two-hand coordination and sight-reading fundamentals to classical sonatinas by Bach, Mozart, and Chopin, alongside contemporary harmonic voicings. Mentored by European conservatory-trained concert pianists.',
    level: 'Beginner to Conservatory Virtuoso',
    ageGroup: 'Kids (5+), Teens & Adults',
    sessionsCount: 16,
    durationMins: 45,
    priceINR: 13999,
    priceUSD: 180,
    image: 'https://images.unsplash.com/photo-1520523839898-50712825e3a7?auto=format&fit=crop&w=1000&q=80',
    teacherName: 'Elena Rostova',
    teacherTitle: 'Concert Pianist & Conservatory Fellow',
    teacherImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80',
    curriculum: [
      {
        pillar: 'Pillar 1: Anatomy & Touch Architecture',
        topics: [
          'Ergonomic wrist poise, weight-drop touch, and finger arch mechanics',
          'Individual finger independence & thumb-tuck fluid motion',
          'Major and harmonic minor scale fingering across octaves',
          'Legato, staccato, tenuto, and portamento articulation'
        ]
      },
      {
        pillar: 'Pillar 2: Grand Staff & Sight Reading',
        topics: [
          'Treble and Bass clef simultaneous reading fluency',
          'Metric subdivision: sixteenth notes, syncopation, and dotted rhythms',
          'Key signatures, circle of fifths & harmonic intervals',
          'Ear training: pitch identification and melodic transcription'
        ]
      },
      {
        pillar: 'Pillar 3: Classical & Contemporary Repertoire',
        topics: [
          'Bach Notebook of Anna Magdalena selections',
          'Clementi and Kuhlau sonatinas with dynamic balance',
          'Modern film compositions & jazz chord progressions',
          'Pedal artistry: damper, sostenuto, and soft pedal nuance'
        ]
      },
      {
        pillar: 'Pillar 4: Musicality & Performance Poise',
        topics: [
          'Rubato timing and dynamic expression (pianissimo to fortissimo)',
          'Memorization strategies for stage recitals',
          'Lead sheet comping and chord voicing exploration',
          'Annual Saremi Conservatory Recital presentation'
        ]
      }
    ],
    outcomes: [
      'Sight-read grand staff classical and modern pieces with confidence',
      'Execute two-hand independent polyphonic voice leading effortlessly',
      'Perform complete recital pieces with refined touch and emotional phrasing',
      'Receive accredited Saremi Grade 1-8 Piano Diplomas'
    ]
  },
  {
    id: 'c-tabla-rhythm',
    slug: 'tabla-rhythm-science',
    title: 'Tabla & Tala Science',
    category: 'tabla',
    tagline: 'The mathematical language of bols, Bayan modulation, and rhythmic precision.',
    description: 'Learn the sacred Farukhabad and Delhi gharana traditions of the Indian sub-continent percussion. Master crisp Dayan strokes (Ta, Tin, Tun), resonant Bayan bass slides (Ghe, Dha), Peshkars, Kaydas, Tihais, and accompaniment science for vocals and instruments.',
    level: 'Beginner to Advanced',
    ageGroup: 'Ages 7 to Adults',
    sessionsCount: 16,
    durationMins: 45,
    priceINR: 11999,
    priceUSD: 150,
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1000&q=80',
    teacherName: 'Pt. Subhashish Bhattacharya',
    teacherTitle: 'Farukhabad Tradition Master Performer',
    teacherImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    curriculum: [
      {
        pillar: 'Pillar 1: Nikas & Stroke Acoustics',
        topics: [
          'Proper sitting posture and finger placement on Dayan & Bayan',
          'Clarity of open strokes: Dha, Dhin, Ge, Na',
          'Controlled closed strokes: Ti, Te, Ke, Kat',
          'Bayan modulations: Ghisa bass pressure sliding techniques'
        ]
      },
      {
        pillar: 'Pillar 2: Tala Architecture & Cycles',
        topics: [
          'Teentaal (16 matras), Jhaptal (10 matras), and Ektaal (12 matras)',
          'Theka recitation with hand clapping (Padhant) and Solfège count',
          'Layakari: Thah, Dugun, Tigun, Chaugun mastery',
          'Nauhakka and Damdar/Bedam Tihai mathematics'
        ]
      },
      {
        pillar: 'Pillar 3: Classical Solo Repertoire',
        topics: [
          'Peshkar: melodic rhythmic opening themes',
          'Kaydas and Palta variations from Farukhabad & Delhi lineages',
          'Rela: rapid fire finger speed drills (300+ BPM clarity)',
          'Tukras, Chakradars, and Gat compositions'
        ]
      },
      {
        pillar: 'Pillar 4: Sangat & Accompaniment Mastery',
        topics: [
          'Vocal accompaniment: Keherwa, Dadra, and Vilambit Khayal support',
          'Instrumental Lehara coordination and responsive accompaniment',
          'Acoustic microphone calibration for live performance',
          'Saremi Conservatory Percussion Diploma examination'
        ]
      }
    ],
    outcomes: [
      'Recite and execute intricate classical tala cycles with razor-sharp precision',
      'Play rapid Rela and Kayda variations with clarity and even tonal balance',
      'Accompany vocalists and instrumentalists with intuitive musical empathy',
      'Attain graded certification recognized by classical percussion societies'
    ]
  },
  {
    id: 'c-guitar-fingerstyle',
    slug: 'acoustic-fingerstyle-guitar',
    title: 'Acoustic & Classical Guitar',
    category: 'guitar',
    tagline: 'Fingertip precision, chord geometry, and soulful acoustic fingerpicking.',
    description: 'From open chord fluidity and strumming dynamics to Travis picking, Spanish nylon classical polyphony, and contemporary percussive acoustic techniques. Build effortless fretboard dexterity without strain.',
    level: 'Beginner to Intermediate',
    ageGroup: 'Kids (8+), Teens & Adults',
    sessionsCount: 16,
    durationMins: 45,
    priceINR: 11999,
    priceUSD: 155,
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1000&q=80',
    teacherName: 'Arjun Dasgupta',
    teacherTitle: 'Berklee Alumnus & Session Virtuoso',
    teacherImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    curriculum: [
      {
        pillar: 'Pillar 1: Fretboard Mechanics & Posture',
        topics: [
          'Thumb anchoring, wrist alignment & zero-strain barring technique',
          'Fingertip calluses development and clean note fretting',
          'Right-hand P-I-M-A classical positioning and nail care',
          'Chromatic warmup exercises and metronome synchronization'
        ]
      },
      {
        pillar: 'Pillar 2: Chords, Harmony & Groove',
        topics: [
          'Essential open chords (CAGED foundation) & seamless transitions',
          'Barre chords (F, Bm, minor 7ths) with clean tone clarity',
          'Rhythmic strumming patterns: syncopation, palm muting, accents',
          'Ear training: recognizing chord progressions (I-IV-V-vi)'
        ]
      },
      {
        pillar: 'Pillar 3: Fingerstyle Repertoire & Picking',
        topics: [
          'Alternating bass Travis picking patterns',
          'Classical Spanish etudes (Sor, Tarrega, Carcassi)',
          'Contemporary fingerstyle arrangements (pop & film melodies)',
          'Hammer-ons, pull-offs, slides, and natural harmonics'
        ]
      },
      {
        pillar: 'Pillar 4: Soloing & Repertoire Showcase',
        topics: [
          'Pentatonic and major scale boxes across all 6 strings',
          'Improvising melodic fills over backing loops',
          'Transposition, capo strategies & studio recording basics',
          'Solo performance recital at Saremi Academy Showcase'
        ]
      }
    ],
    outcomes: [
      'Transition between open and barre chords instantly and cleanly',
      'Play fingerstyle arrangements with independent bass lines and melodies',
      'Solo effortlessly over acoustic progressions using pentatonic scales',
      'Earn the Saremi Graded Guitar Conservatory Certificate'
    ]
  },
  {
    id: 'c-kids-conservatory',
    slug: 'kids-conservatory-music',
    title: 'Kids Musical Explorer (Ages 5-12)',
    category: 'kids',
    tagline: 'Playful ear training, swara storytelling, and fundamental instrument poise.',
    description: 'Specially engineered by early childhood music pedagogues to spark lifelong love for sound. Combines Kodály solfège, animal rhythm stories, keyboard navigation, and joyful vocal culture in gentle, inspiring 1:1 sessions.',
    level: 'Foundational',
    ageGroup: 'Kids Ages 5 to 12',
    sessionsCount: 16,
    durationMins: 35,
    priceINR: 10499,
    priceUSD: 140,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
    teacherName: 'Ananya Deshpande',
    teacherTitle: 'Early Childhood Music Specialist',
    teacherImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    curriculum: [
      {
        pillar: 'Pillar 1: Joyful Swara & Ear Training',
        topics: [
          'Musical animal characters representing the seven swaras (Sa Re Ga Ma...)',
          'High vs. low pitch identification through playful voice games',
          'Singing in unison with colorful Tanpura visual characters',
          'Breathing bubble exercises for diaphragm development'
        ]
      },
      {
        pillar: 'Pillar 2: Rhythm & Body Percussion',
        topics: [
          'Clapping the beat with animal rhythm stories (Elephant, Rabbit, Cheetah)',
          'Introduction to basic 4-beat and 8-beat steady pulses',
          'Interactive metronome clapping games',
          'First introduction to small percussion instruments'
        ]
      },
      {
        pillar: 'Pillar 3: Keyboard & Pitch Poise',
        topics: [
          'Finding Middle C and understanding the black & white key layout',
          'Gentle curved finger posture like holding a soap bubble',
          'Simple 5-finger melodies and beloved childhood tunes',
          'Expressive dynamic play: Loud (Forte) and Soft (Piano)'
        ]
      },
      {
        pillar: 'Pillar 4: Confidence & Musical Celebration',
        topics: [
          'Singing or playing while smiling and facing the camera',
          'Recording first milestone performance video for parents',
          'Weekly digital sticker badges and practice celebration',
          'Junior Conservatory Certificate of Musical Discovery'
        ]
      }
    ],
    outcomes: [
      'Develop perfect pitch recognition and rhythmic pulse early in life',
      'Foster deep cognitive focus, memory, and emotional expression',
      'Play 8+ complete children pieces with proper hand poise',
      'Graduate to specialized 1:1 Vocal, Piano, or Tabla tracks'
    ]
  }
];

// -------------------------------------------------------------
// FACULTY & GURUS REPOSITORY
// -------------------------------------------------------------
export const ACADEMY_TEACHERS: TeacherItem[] = [
  {
    id: 't-sunanda-sharma',
    name: 'Vidushi Sunanda Sharma',
    discipline: 'Hindustani Classical Vocal',
    category: 'vocals',
    experienceYears: 24,
    title: 'Senior Vocalist & Sangeet Shiromani',
    tradition: 'Banaras & Kirana Gharana',
    bio: 'One of the leading vocalists of her generation, trained extensively under the legendary Padma Vibhushan Girija Devi. Performed at premier music festivals in India, London, New York, and Paris. Renowned for her Khayal purity, subtle Thumri expressions, and structured voice culture training.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
    rating: 4.98,
    reviewCount: 142,
    specialties: ['Voice Culture', 'Kharaj Riyaaz', 'Raag Yaman', 'Thumri & Dadra', 'Khayal Improvisation'],
    audioSampleTitle: 'Raag Bhairav Aalap Demonstration',
    availableSlots: ['Mon 5:00 PM', 'Wed 6:30 PM', 'Sat 10:00 AM', 'Sun 4:00 PM']
  },
  {
    id: 't-subhashish-bhattacharya',
    name: 'Pt. Subhashish Bhattacharya',
    discipline: 'Tabla & Tala Science',
    category: 'tabla',
    experienceYears: 20,
    title: 'Senior Farukhabad Gharana Performer',
    tradition: 'Farukhabad & Delhi Gharana',
    bio: 'Descendant of classical musical heritage, Pt. Subhashish has accompanied world-renowned maestros across Europe, the US, and Asia. Specializes in traditional Peshkar phrasing, micro-timing modulation, and laying solid rhythmic foundations for learners of all ages.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    rating: 4.96,
    reviewCount: 98,
    specialties: ['Peshkar & Kayda', 'Teentaal Mathematics', 'Bayan Modulation', 'Sangat Accompaniment'],
    audioSampleTitle: 'Teentaal Peshkar & Farukhabad Kayda',
    availableSlots: ['Tue 4:00 PM', 'Thu 6:00 PM', 'Sat 11:30 AM', 'Sun 2:30 PM']
  },
  {
    id: 't-elena-rostova',
    name: 'Elena Rostova, M.Mus.',
    discipline: 'Western Classical Piano',
    category: 'piano',
    experienceYears: 16,
    title: 'Conservatory Concert Pianist & ABRSM Mentor',
    tradition: 'St. Petersburg & Royal Academy Tradition',
    bio: 'Master of Music in Piano Performance with over 16 years of international concert and pedagogical experience. Specializes in zero-tension anatomical hand biomechanics, polyphonic voice leading, and guiding candidates with 100% distinction rates.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80',
    rating: 4.99,
    reviewCount: 176,
    specialties: ['Sight-Reading', 'Bach Polyphony', 'Chopin Nocturnes', 'Hand Ergonomics', 'ABRSM Prep'],
    audioSampleTitle: 'Chopin Nocturne Op. 9 No. 2 Excerpt',
    availableSlots: ['Mon 7:00 PM', 'Wed 4:30 PM', 'Fri 5:30 PM', 'Sat 3:00 PM']
  },
  {
    id: 't-arjun-dasgupta',
    name: 'Arjun Dasgupta',
    discipline: 'Acoustic & Classical Guitar',
    category: 'guitar',
    experienceYears: 14,
    title: 'Berklee Alumnus & Fingerstyle Virtuoso',
    tradition: 'Classical Spanish & Modern Contemporary',
    bio: 'Guitarist and session producer trained in Boston and Madrid. Arjun seamlessly bridges classical Spanish nylon-string polyphony with modern percussive fingerstyle and acoustic jazz arrangements.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    rating: 4.94,
    reviewCount: 112,
    specialties: ['Travis Picking', 'Spanish Classical', 'CAGED Fretboard Geometry', 'Acoustic Composition'],
    audioSampleTitle: 'Mediterranean Breeze - Fingerstyle Acoustic',
    availableSlots: ['Tue 6:30 PM', 'Thu 7:00 PM', 'Sat 1:00 PM', 'Sun 5:00 PM']
  }
];

// -------------------------------------------------------------
// MASTERCLASSES REPOSITORY
// -------------------------------------------------------------
export const ACADEMY_MASTERCLASSES: MasterclassItem[] = [
  {
    id: 'mc-vocal-culture',
    title: 'Voice Culture & Microtone Anatomy in Classical Vocal',
    maestro: 'Ustad Rashid Khan Foundation Chair',
    maestroTitle: 'Legendary Vocal Maestro & Sangeet Natak Akademi Fellow',
    instrument: 'Vocals',
    date: 'Sunday, October 12, 2026',
    time: '5:00 PM - 7:30 PM IST',
    duration: '2.5 Hours Interactive',
    feeINR: 1499,
    status: 'upcoming',
    description: 'An exclusive masterclass addressing the vocal biology, breath dynamics, and swara sthana microtonal positioning required to sustain flawless pitch purity during rapid sargams and khayal bol-alap.',
    topics: [
      'Microtone (Shruti) differentiation in Raag Bhairavi & Todi',
      'The physics of vocal cord compression without neck strain',
      'Kharaj riyaaz daily routine practiced by Kirana & Gwalior masters',
      'Live student diagnostic critique (3 selected attendees)'
    ],
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'mc-tabla-polyrhythm',
    title: 'Polyrhythms & Micro-timing: From Farukhabad to Modern Ensembles',
    maestro: 'Pt. Anindo Chatterjee Legacy Fellow',
    maestroTitle: 'Senior Percussionist & Global Rhythmic Collaborator',
    instrument: 'Tabla & Tala',
    date: 'Saturday, October 25, 2026',
    time: '6:00 PM - 8:30 PM IST',
    duration: '2.5 Hours Interactive',
    feeINR: 1499,
    status: 'upcoming',
    description: 'Deep dive into complex cross-metric tihais, chakradars, and the mathematical beauty of Indian rhythmic structures as applied to contemporary world music and acoustic accompaniment.',
    topics: [
      'Sub-beat division: Tisra, Khanda, and Sankirna jatis',
      'Bayan modulation physics and resonance control',
      'Designing symmetric and asymmetric tihais on the fly',
      'Live rhythmic improvisation workshop'
    ],
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'mc-sitar-techniques',
    title: 'Advanced Meend & Gamak Techniques in Sitar',
    maestro: 'Ustad Shujaat Khan Masterclass Series',
    maestroTitle: 'Legendary Sitarist & Imdadkhani Gharana Icon',
    instrument: 'Sitar',
    date: 'August 14, 2026',
    time: 'Recorded',
    duration: '2 Hours Interactive',
    feeINR: 999,
    status: 'recorded',
    description: 'Learn the intricate pulling techniques of the Imdadkhani gharana. Master the art of vocalized sitar playing (gayaki ang) through detailed fret manipulation and sympathetic string resonance.',
    topics: [
      'Gayaki Ang (Vocal style) translation on strings',
      'Perfecting the 4-fret meend pull',
      'Right-hand mizrab angles for tonal depth',
      'Exploration of Raag Darbari Kanada'
    ],
    image: 'https://images.unsplash.com/photo-1549645934-2e21fa7e1898?auto=format&fit=crop&w=800&q=80'
  }
];

// -------------------------------------------------------------
// EVENTS & RECITALS REPOSITORY
// -------------------------------------------------------------
export const ACADEMY_EVENTS: EventItem[] = [
  {
    id: 'ev-annual-recital-2026',
    title: 'Saremi Conservatory Annual Recital 2026',
    category: 'Annual Recital',
    date: 'December 18-20, 2026',
    venue: 'Live Global Stream & NCPA Mumbai Auditorium',
    description: 'Our premier annual festival where certified scholars from 24+ countries perform solo and ensemble pieces before an international panel of gurus, industry producers, and families.',
    status: 'Registration Open',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ev-baithak-autumn',
    title: 'Autumn Mehfil: A Celebration of Raags & Rhythms',
    category: 'Student Showcase',
    date: 'November 14, 2026 • 7:00 PM IST',
    venue: 'Interactive Virtual Auditorium',
    description: 'Intimate chamber concert featuring Level 3 and Level 4 vocal, piano, and tabla scholars presenting seasonal bandishes and sonatinas.',
    status: 'Live Stream',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80'
  }
];

// -------------------------------------------------------------
// CONSERVATORY JOURNAL / BLOG
// -------------------------------------------------------------
export const ACADEMY_BLOG: BlogPostItem[] = [
  {
    slug: 'the-sacred-discipline-of-kharaj-riyaaz',
    title: 'The Sacred Discipline of Kharaj Riyaaz: Deepening Your Vocal Core',
    excerpt: 'Why the early morning lower-octave practice (Mandra Saptak) is the bedrock of vocal stability, resonance, and effortless high notes in classical singing.',
    category: 'Vocal Science',
    readTime: '6 min read',
    date: 'Sep 28, 2026',
    author: {
      name: 'Vidushi Sunanda Sharma',
      role: 'Senior Guru of Vocal Pedagogy',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80'
    },
    content: [
      'In the classical Hindustani oral tradition, the dawn hours between 4:00 AM and 6:30 AM are revered as Brahma Muhurta. For vocalists, this time is consecrated to Kharaj Riyaaz — the deliberate cultivation of the lower octave, descending from Madhya Sa down into the depths of the Mandra and Anumandra saptaks.',
      'Unlike the temptation to immediately reach for dazzling high notes (Taar Saptak), vocal masters understand that the height of your upper range is purely a mathematical reflection of the depth of your lower foundation.',
      'When you sustain Mandra Sa, Kharaj Re, and Mandra Ni with relaxed abdominal support and a lowered larynx, you gently thicken the true vocal folds, release micro-tensions in the pharynx, and condition the chest resonators to amplify the natural overtones of your voice.',
      'Key guidelines for daily Kharaj practice: 1) Never push or force volume in the lower notes; 2) Maintain an unbroken acoustic Tanpura drone tuned accurately to your fundamental tonic; 3) Keep vowels rounded (Aakar or Omkaar); 4) Conclude with gentle Kharaj slides before moving into upper octaves.'
    ],
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80'
  },
  {
    slug: 'piano-wrist-poise-and-biomechanics',
    title: 'Piano Wrist Poise & Biomechanics: Playing Without Fatigue or Tension',
    excerpt: 'How arm weight transfer and wrist flexibility create rich acoustic resonance while safeguarding against repetitive strain injuries.',
    category: 'Piano Technique',
    readTime: '5 min read',
    date: 'Sep 20, 2026',
    author: {
      name: 'Elena Rostova, M.Mus.',
      role: 'Conservatory Concert Fellow',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80'
    },
    content: [
      'A frequent hurdle for piano students is the habit of pressing keys using isolated finger muscles rather than letting the natural weight of the forearm and shoulder sink into the keybed.',
      'When your wrist is locked or stiff, the sound produced is harsh, brittle, and dynamic range becomes severely constrained. More critically, tension accumulates in the extensor tendons, leading to fatigue and tendonitis.',
      'The Russian conservatory tradition emphasizes the "breathing wrist" — treating the wrist joint as a supple shock absorber that flexes slightly downward on note onset and rises gently on release.',
      'Practice dropping into a single key from 3 inches above with a completely limp wrist. Feel the bottom of the key support your entire arm weight, then release tension immediately while keeping the hammer held down. This single exercise transforms tone quality across classical sonatas.'
    ],
    image: 'https://images.unsplash.com/photo-1520523839898-50712825e3a7?auto=format&fit=crop&w=1000&q=80'
  },
  {
    slug: 'the-geometry-of-teentaal',
    title: 'The Sacred Geometry of Teentaal: Understanding 16 Beats in Space and Time',
    excerpt: 'Deconstructing the king of Indian classical rhythmic cycles: four quadrants, the polarity of Khali, and the triumphant return to Som.',
    category: 'Tala Science',
    readTime: '7 min read',
    date: 'Sep 12, 2026',
    author: {
      name: 'Pt. Subhashish Bhattacharya',
      role: 'Faculty Chair of Percussion',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80'
    },
    content: [
      'Teentaal is often described as the sun at the center of the Indian rhythmic solar system. Its architecture is pristine: 16 matras (beats) divided evenly into four vibhags (quadrants) of four beats each.',
      'What gives Teentaal its hypnotic dynamic tension is its balance of weight and void: Claps on beat 1 (Som), beat 5, and beat 13, contrasted against the wave of the hand on beat 9 — the Khali (void).',
      'In Farukhabad tala pedagogy, the Khali on beat 9 acts as a rhythmic mirror. The open resonant bass of the Bayan drops out (Dhagi Dhagi becomes Taki Taki), creating a moment of weightlessness that makes the eventual return to beat 1 feel like arriving home.',
      'Mastering Teentaal is not merely about counting numbers; it is about feeling time as an unbroken cyclical circle rather than a linear Western bar line.'
    ],
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1000&q=80'
  }
];

// -------------------------------------------------------------
// REVIEWS & TESTIMONIALS
// -------------------------------------------------------------
export const ACADEMY_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't-1',
    name: 'Dr. Meera Swaminathan',
    role: 'Physician & Adult Vocal Scholar',
    location: 'San Jose, California, USA',
    course: 'Hindustani Classical Vocal',
    quote: 'As a busy surgeon, I assumed learning classical music in my 40s was unrealistic. Saremi changed everything. Vidushi Sunanda Sharma identifies subtle microtone deviations through the screen instantly. The 1:1 live feedback and Tanpura studio make my daily riyaaz therapeutic and structured.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    durationStudying: '14 Months at Saremi'
  },
  {
    id: 't-2',
    name: 'Rajesh & Kavita Rao',
    role: 'Parents of Rohan (Age 8)',
    location: 'London, United Kingdom',
    course: 'Tabla & Rhythm Science',
    quote: 'Finding authentic Indian classical percussion mentorship outside of India was our dream. Pt. Subhashish connects so warmly with our 8-year-old son! Rohan now counts Teentaal claps while walking to school and recently performed at our local cultural festival with distinction.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    durationStudying: '9 Months at Saremi'
  },
  {
    id: 't-3',
    name: 'Aiden Vance',
    role: 'Software Architect & Pianist',
    location: 'Toronto, Canada',
    course: 'Western Classical Piano',
    quote: 'I had plateaued with YouTube tutorials for two years. Within three weeks with Elena Rostova, she completely resolved my wrist fatigue by redesigning my hand posture. Passing my Grade 5 exam with distinction this summer was purely thanks to her meticulous diagnostic guidance.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    durationStudying: '11 Months at Saremi'
  }
];

// -------------------------------------------------------------
// FAQS REPOSITORY
// -------------------------------------------------------------
export const ACADEMY_FAQS: FAQItem[] = [
  {
    category: 'Pedagogy & Classes',
    question: 'How do 1:1 live interactive online music classes actually work?',
    answer: 'Every class is a real-time, high-fidelity 1:1 session between you and your assigned mentor via our integrated Agora live conservatory studio. Your guru demonstrates phrases, listens to your sound without latency distortion, identifies microtone pitch or finger mechanical errors, and assigns targeted exercises for your daily practice.'
  },
  {
    category: 'Pedagogy & Classes',
    question: 'How does Saremi Academy differ from pre-recorded video tutorials?',
    answer: 'Pre-recorded videos provide zero feedback on physical posture, pitch placement, or rhythmic errors — which frequently causes students to engrave bad habits that take years to unlearn. Saremi combines live 1:1 diagnostic correction by vetted conservatory maestros with daily interactive practice tools, ensuring rapid, safe, and artistically authentic progress.'
  },
  {
    category: 'Equipment & Prerequisites',
    question: 'Do I need prior musical experience or an expensive instrument before booking a trial?',
    answer: 'None whatsoever! For vocal classes, all you need is a quiet room, stable internet, and a pair of headphones. For piano, guitar, or tabla, any beginner-grade instrument or standard 61-key keyboard is sufficient. During your free 1:1 diagnostic trial, your guru will evaluate your current stage and provide honest advice on instrument requirements.'
  },
  {
    category: 'Scheduling & Policies',
    question: 'What if I need to reschedule a class due to work or school commitments?',
    answer: 'We understand modern schedules. You can reschedule any session with up to 4 hours advance notice directly through your student dashboard without forfeiting session credits. Classes can be rescheduled into open slots within your package validity period.'
  },
  {
    category: 'Grading & Certifications',
    question: 'Are Saremi Academy diplomas and certifications officially recognized?',
    answer: 'Yes. Our 4-Pillar Conservatory Grading System is benchmarked against international conservatory criteria (including Sangeet Natak Akademi frameworks and classical European conservatory standards). Upon completing each pillar and passing a live jury jury evaluation, scholars receive verifiable digital and physical graded diplomas.'
  },
  {
    category: 'Kids & Parents',
    question: 'Can parents monitor their child’s progress and teacher feedback?',
    answer: 'Absolutely. Parents can review class attendance, listen to recorded homework submissions, read guru feedback notes, and track weekly milestone achievements directly through the learner progress dashboard and milestone reports.'
  }
];
