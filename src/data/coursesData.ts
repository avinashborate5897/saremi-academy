import {
  Course,
  CourseCategory,
  CourseLevelItem,
  TeacherProfile,
  TeacherAvailability
} from '../types';

export const COURSE_CATEGORIES: CourseCategory[] = [
  {
    id: 'cat-vocals',
    name: 'Classical & Semi-Classical Vocals',
    slug: 'vocals',
    description: 'Hindustani Classical, Khayal, Thumri, Bhajans, and Voice Culture',
    icon: 'Mic',
    instrument: 'vocals',
    displayOrder: 1
  },
  {
    id: 'cat-piano',
    name: 'Western Classical & Contemporary Piano',
    slug: 'piano',
    description: 'Sight-reading, classical sonatinas, posture, and harmonic mastery',
    icon: 'Music2',
    instrument: 'piano',
    displayOrder: 2
  },
  {
    id: 'cat-guitar',
    name: 'Acoustic & Classical Guitar',
    slug: 'guitar',
    description: 'Fingerstyle polyphony, CAGED fretboard logic, and melodic phrasing',
    icon: 'Guitar',
    instrument: 'guitar',
    displayOrder: 3
  },
  {
    id: 'cat-tabla',
    name: 'Classical Tabla & Tala Science',
    slug: 'tabla',
    description: 'Benaras, Delhi & Farukhabad gharana bols, kaydas, and teentaal mastery',
    icon: 'Drum',
    instrument: 'tabla',
    displayOrder: 4
  },
  {
    id: 'cat-kids',
    name: 'Kids Music Explorer (Ages 5-12)',
    slug: 'kids',
    description: 'Playful ear training, swara stories, rhythm games, and foundational pitch',
    icon: 'Sparkles',
    instrument: 'all',
    displayOrder: 5
  }
];

export const COURSE_LEVELS: CourseLevelItem[] = [
  {
    id: 'lvl-foundation',
    name: 'Foundation',
    slug: 'foundation',
    description: 'Zero musical background needed. Build physical posture, breath anchoring, and note literacy.',
    order: 1,
    prerequisites: 'None'
  },
  {
    id: 'lvl-developing',
    name: 'Developing',
    slug: 'developing',
    description: 'Comfortable with basic pitch and rhythm. Introduction to structured ragas, scale shapes, and bandishes.',
    order: 2,
    prerequisites: 'Basic pitch awareness or 6 months prior study'
  },
  {
    id: 'lvl-proficient',
    name: 'Proficient',
    slug: 'proficient',
    description: 'Complex rhythmic structures (layakari), rapid improvisations (taans), and classical performance pieces.',
    order: 3,
    prerequisites: 'Intermediate repertoire, solid tempo control'
  },
  {
    id: 'lvl-advanced',
    name: 'Advanced',
    slug: 'advanced',
    description: 'Concert-level repertoire, microtonal nuances (shruti), stage presentation, and diploma examination.',
    order: 4,
    prerequisites: 'Formal evaluation audition by senior faculty'
  }
];

export const TEACHERS_DATA: TeacherProfile[] = [
  {
    id: 't-sunanda',
    name: 'Vidushi Sunanda Sharma',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
    bio: 'Direct disciple of Padma Vibhushan Girija Devi. Specializes in Benaras and Kirana Gharana Gayaki, emphasizing pristine microtonal swar-sthana, Kharaj riyaaz discipline, and expressively emotive Thumri and Khayal.',
    specialization: 'Hindustani Classical Vocal, Khayal & Voice Culture',
    experience: 22,
    languages: ['English', 'Hindi', 'Bengali'],
    qualifications: [
      'Master of Music (Sangeet Praveen) - Gold Medalist',
      'Direct Apprentice of Girija Devi (Gurukul system)',
      'A-Grade All India Radio Artiste'
    ],
    courses: ['hindustani-classical-vocals', 'voice-culture-resonance'],
    availability: [
      'Monday 10:00 AM - 1:00 PM IST',
      'Wednesday 4:00 PM - 8:00 PM IST',
      'Friday 3:00 PM - 7:00 PM IST',
      'Saturday 10:00 AM - 2:00 PM IST'
    ],
    intro_video: 'https://assets.mixkit.co/videos/preview/mixkit-woman-playing-piano-in-a-studio-41481-large.mp4',
    rating: 4.98,
    reviewCount: 142,
    title: 'Senior Vocal Exponent & Conservatory Chair',
    tradition: 'Benaras & Kirana Gharana',
    email: 'sunanda@saremi.academy',
    active: true,
    reviews: [
      {
        id: 'rev-1',
        studentName: 'Aarav Mehta (London, UK)',
        rating: 5,
        comment: 'Vidushi Sunanda completely transformed how I hold my notes. My breath control in Mandra Saptak doubled within three months.',
        date: '2 weeks ago'
      },
      {
        id: 'rev-2',
        studentName: 'Priyanka Sen (Bangalore)',
        rating: 5,
        comment: 'The gentlest yet most demanding guru. Her ear catches microtonal slips instantly through our live acoustic studio.',
        date: '1 month ago'
      }
    ]
  },
  {
    id: 't-julian',
    name: 'Julian Vance-Moreau',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    bio: 'Educated at the Royal Academy of Music, London. Julian has concertized across Europe and specializes in pedagogical kinesthetics, classical touch, Chopin nocturnes, and harmonic theory.',
    specialization: 'Western Classical & Contemporary Piano',
    experience: 16,
    languages: ['English', 'French'],
    qualifications: [
      'DipRAM & LRAM (Piano Pedagogy) - Royal Academy of Music',
      'Steinway & Sons Featured Performing Artist',
      'ABRSM & Trinity Graded Exam Mentor'
    ],
    courses: ['western-classical-piano', 'piano-sight-reading-mastery'],
    availability: [
      'Tuesday 2:00 PM - 6:00 PM GMT',
      'Thursday 2:00 PM - 6:00 PM GMT',
      'Saturday 1:00 PM - 5:00 PM GMT',
      'Sunday 10:00 AM - 2:00 PM GMT'
    ],
    intro_video: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-playing-the-piano-40508-large.mp4',
    rating: 4.95,
    reviewCount: 118,
    title: 'Department Head of Western Keyboard Studies',
    tradition: 'European Royal Conservatory Method',
    email: 'julian@saremi.academy',
    active: true,
    reviews: [
      {
        id: 'rev-3',
        studentName: 'Rohan Deshmukh (San Jose, CA)',
        rating: 5,
        comment: 'Julian taught me how to eliminate wrist tension. My speed on Bach Two-Part Inventions improved effortlessly.',
        date: '3 weeks ago'
      }
    ]
  },
  {
    id: 't-aniruddha',
    name: 'Pt. Aniruddha Mukherjee',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    bio: 'Carrying forward the Benaras Gharana lineage of Pt. Samta Prasad. Master of crisp dayan clarity, heavy bayan modulation, and complex teentaal and dhamar chakradhar tihais.',
    specialization: 'Classical Tabla & Tala Science',
    experience: 25,
    languages: ['English', 'Hindi', 'Bengali'],
    qualifications: [
      'Sangeet Visharad & Alankar - Benaras Hindu University',
      'Accompanist to Top-Tier Sitar & Sarod Maestros worldwide',
      'Senior Examiner, Akhil Bharatiya Gandharva Mahavidyalaya'
    ],
    courses: ['classical-tabla-mastery', 'tala-science-rhythm-architecture'],
    availability: [
      'Tuesday 10:00 AM - 1:00 PM IST',
      'Thursday 4:00 PM - 8:00 PM IST',
      'Saturday 11:00 AM - 4:00 PM IST',
      'Sunday 3:00 PM - 7:00 PM IST'
    ],
    intro_video: 'https://assets.mixkit.co/videos/preview/mixkit-playing-an-indian-drum-in-close-up-42435-large.mp4',
    rating: 4.97,
    reviewCount: 96,
    title: 'Dean of Percussion & Rhythmic Studies',
    tradition: 'Benaras Gharana',
    email: 'aniruddha@saremi.academy',
    active: true,
    reviews: [
      {
        id: 'rev-4',
        studentName: 'Devansh K. (Dallas, TX)',
        rating: 5,
        comment: 'Panditji breaks down DhaGeNaTiNaKeNa into anatomical finger movements. The bayan bass modulation training is unmatched.',
        date: '1 week ago'
      }
    ]
  },
  {
    id: 't-matthew',
    name: 'Matthew Reed',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80',
    bio: 'Fingerstyle virtuoso and Berklee College of Music alumnus. Specializes in percussive acoustic fingerstyle, alternate tunings (DADGAD), chord-melody jazz voicing, and Spanish classical nylon techniques.',
    specialization: 'Acoustic & Classical Guitar',
    experience: 14,
    languages: ['English', 'Spanish'],
    qualifications: [
      'BM in Guitar Performance - Berklee College of Music',
      'Fingerstyle Guitar Championship Finalist',
      'Yamaha Acoustic Guitar Endorsed Mentor'
    ],
    courses: ['acoustic-fingerstyle-guitar', 'classical-guitar-repertoire'],
    availability: [
      'Monday 3:00 PM - 7:00 PM EST',
      'Wednesday 3:00 PM - 7:00 PM EST',
      'Friday 1:00 PM - 5:00 PM EST',
      'Saturday 11:00 AM - 3:00 PM EST'
    ],
    intro_video: 'https://assets.mixkit.co/videos/preview/mixkit-guitarist-playing-acoustic-guitar-chords-41120-large.mp4',
    rating: 4.94,
    reviewCount: 84,
    title: 'Senior Faculty in String Instruments',
    tradition: 'Modern Acoustic & Andalusian Classical',
    email: 'matthew@saremi.academy',
    active: true,
    reviews: [
      {
        id: 'rev-5',
        studentName: 'Sneha Rao (Melbourne)',
        rating: 5,
        comment: 'Matthew unlocked the entire fretboard for me using the CAGED logic. Best 1:1 guitar teacher I have ever had.',
        date: '2 weeks ago'
      }
    ]
  },
  {
    id: 't-ananya',
    name: 'Ananya Iyer',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    bio: 'Child pedagogy specialist certified in Kodály and Orff Schulwerk methods with extensive Indian classical vocal training. Leads the early childhood music explorer curriculum with warmth and infectious enthusiasm.',
    specialization: 'Early Childhood Music Pedagogy & Youth Vocals',
    experience: 11,
    languages: ['English', 'Hindi', 'Tamil'],
    qualifications: [
      'Certified Orff Schulwerk Music Educator Level III',
      'MA in Musicology - University of Madras',
      'Child Psychology & Kinesthetic Ear Training Specialist'
    ],
    courses: ['kids-music-explorer', 'hindustani-classical-vocals'],
    availability: [
      'Tuesday 3:00 PM - 7:00 PM IST',
      'Thursday 3:00 PM - 7:00 PM IST',
      'Saturday 9:00 AM - 1:00 PM IST',
      'Sunday 10:00 AM - 2:00 PM IST'
    ],
    intro_video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-recording-a-song-in-a-studio-41485-large.mp4',
    rating: 4.99,
    reviewCount: 165,
    title: 'Director of Early Childhood Music Education',
    tradition: 'Kodály & Indian Swara Integration',
    email: 'ananya@saremi.academy',
    active: true,
    reviews: [
      {
        id: 'rev-6',
        studentName: 'Meera (Mother of 7-yr old Kabir, Toronto)',
        rating: 5,
        comment: 'Ananya made my 7-year old fall in love with singing. He practices his sargams every morning without being asked!',
        date: '4 days ago'
      }
    ]
  }
];

export const COURSES_DATA: Course[] = [
  {
    id: 'c-hindustani-vocal',
    name: 'Hindustani Classical Vocal & Swara Mastery',
    slug: 'hindustani-classical-vocals',
    title: 'Hindustani Classical Vocal & Swara Mastery',
    short_description: 'Pure swara resonance, Kharaj riyaaz discipline, and systematic Raag architecture under Benaras & Kirana Gharana maestros.',
    tagline: 'Pure swara resonance, Kharaj riyaaz discipline, and systematic Raag architecture.',
    description: 'Immerse yourself in authentic 1:1 vocal apprenticeship under Kirana and Benaras gharana maestros. Develop deep breath anchoring, microtonal swar sthana precision, and learn foundational ragas (Yaman, Bhairav, Bilawal, Bhupali) with traditional bandishes, aalap structure, and improvisational taans.',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80',
    category: 'vocals',
    instrument: 'vocals',
    level: 'Foundation to Advanced',
    age_group: 'Kids (6+), Teens & Adults',
    ageGroup: 'Kids (6+), Teens & Adults',
    teacher: 'Vidushi Sunanda Sharma',
    teacher_id: 't-sunanda',
    duration: '12 to 24 Weeks',
    class_duration: 45,
    sessionLengthMinutes: 45,
    number_of_classes: 12,
    sessionsCount: 12,
    sessionsPerWeek: 1,
    priceMonthly: 2499,
    currency: 'INR',
    active_status: true,
    package_id: 'pkg-std-1-1-4s-1m',
    featured: true,
    assessment: 'Continuous audio submission review & end-of-semester jury recital before senior Gharana exponents.',
    certificate: 'Saremi Conservatory Graded Diploma in Hindustani Vocal Performance.',
    curriculum: [
      {
        pillar: 'Pillar 1: Sur & Swara Precision',
        title: 'Sur & Swara Precision',
        topics: [
          'Vocal cord relaxation, diaphragmatic breathing & posture',
          'Kharaj riyaaz (lower octave exploration down to Mandra Saptak)',
          'Solfège Swara system & microtonal micro-slides (Meend)',
          'Acoustic Tanpura drone tuning & pure Sa stabilization'
        ]
      },
      {
        pillar: 'Pillar 2: Laya & Tala Science',
        title: 'Laya & Tala Science',
        topics: [
          'Teentaal (16 beats) clapping, khali-taali cycles, and the Som count',
          'Keherwa (8 beats) & Dadra (6 beats) laya patterns',
          'Layakari drills: Thah, Dugun, and Chaugun vocalization',
          'Tihai construction and rhythmic closures'
        ]
      },
      {
        pillar: 'Pillar 3: Raag Architecture & Bandish',
        title: 'Raag Architecture & Bandish',
        topics: [
          'Raag Yaman: Aroha, Avroha, Pakad, and Vadi-Samvadi balance',
          'Raag Bhupali: Pentatonic majesty and melodic development',
          'Classical Chhota Khayal bandishes with poetic Sahitya meaning',
          'Aalap improvisation, Bol-aalap phrasing, and note expansion'
        ]
      },
      {
        pillar: 'Pillar 4: Performance & Voice Culture',
        title: 'Performance & Voice Culture',
        topics: [
          'Taankari patterns: Sapat, Chhut, and Gamak vocal agility',
          'Microphone acoustics, dynamic range & stage presence',
          'Recording studio discipline and live audio review',
          'Semester recital showcase performance'
        ]
      }
    ],
    modules: [
      {
        id: 'mod-v-1',
        courseId: 'c-hindustani-vocal',
        title: 'Module 1: The Acoustic Foundation (Weeks 1-3)',
        description: 'Breathing ergonomics, Kharaj riyaaz, and pure swar-sthana alignment with acoustic tanpura drone.',
        order: 1,
        learningObjectives: [
          'Master diaphragmatic breath anchoring',
          'Sustain pure Madhyam Sa for 25+ seconds without wobble',
          'Navigate Shuddha Swaras with exact cent intonation'
        ]
      },
      {
        id: 'mod-v-2',
        courseId: 'c-hindustani-vocal',
        title: 'Module 2: Tala Geometry & Rhythmic Stability (Weeks 4-6)',
        description: 'Teentaal, Keherwa and Dadra clapping routines with Dugun/Chaugun subdivision mastery.',
        order: 2,
        learningObjectives: [
          'Maintain independent hand clapping while singing cross-rhythms',
          'Hit the Som precisely across syncopated taans',
          'Calculate and execute 3-part tihais'
        ]
      },
      {
        id: 'mod-v-3',
        courseId: 'c-hindustani-vocal',
        title: 'Module 3: Raag Yaman Exploration & Chhota Khayal (Weeks 7-9)',
        description: 'Detailed study of Raag Yaman in Teentaal with traditional bandish and aalap structures.',
        order: 3,
        learningObjectives: [
          'Memorize and sing traditional bandish in Teentaal',
          'Improvise Badhat in Mandra and Madhya Saptak',
          'Incorporate Meend and Kan-swar ornamentation'
        ]
      },
      {
        id: 'mod-v-4',
        courseId: 'c-hindustani-vocal',
        title: 'Module 4: Virtuosity, Taankari & Recital Showcase (Weeks 10-12)',
        description: 'High-velocity taans, gamak drills, microphone balance, and final jury evaluation.',
        order: 4,
        learningObjectives: [
          'Perform a complete 12-minute Raag Yaman recital',
          'Demonstrate clear double-speed taankari',
          'Receive written conservatory appraisal and diploma'
        ]
      }
    ],
    lessons: [
      {
        id: 'les-v-1',
        moduleId: 'mod-v-1',
        courseId: 'c-hindustani-vocal',
        title: 'Lesson 1: Breath Anchoring & The True Sa',
        summary: 'Posture alignment, diaphragmatic release, and locating your natural tonic pitch with Tanpura.',
        order: 1,
        durationMinutes: 45,
        practiceFocus: 'Daily 20 mins Kharaj riyaaz on low Pa to middle Sa',
        ragasOrPieces: ['Foundational Tanpura Drone in C#']
      },
      {
        id: 'les-v-2',
        moduleId: 'mod-v-1',
        courseId: 'c-hindustani-vocal',
        title: 'Lesson 2: Shuddha Swara Mapping & Bilawal Scale',
        summary: 'Intonation mapping across seven natural notes with sargam singing and hand mudras.',
        order: 2,
        durationMinutes: 45,
        practiceFocus: 'Palta combinations: Sa-Re-Ga, Re-Ga-Ma, Ga-Ma-Pa',
        ragasOrPieces: ['Bilawal Thaat']
      },
      {
        id: 'les-v-3',
        moduleId: 'mod-v-2',
        courseId: 'c-hindustani-vocal',
        title: 'Lesson 3: Teentaal Anatomy & Som Synchronization',
        summary: 'Understanding 4 vibhags (4+4+4+4), Taali (1, 5, 13) and Khali (9). Clapping while chanting bols.',
        order: 3,
        durationMinutes: 45,
        practiceFocus: 'Clapping Teentaal with metronome at 60 BPM',
        ragasOrPieces: ['Teentaal Theka']
      },
      {
        id: 'les-v-4',
        moduleId: 'mod-v-3',
        courseId: 'c-hindustani-vocal',
        title: 'Lesson 4: Raag Yaman - Pakad, Aroha & Avroha',
        summary: 'Teevra Madhyam intonation, omitting Sa and Pa in ascent (Ni-Re-Ga), and characteristic phrases.',
        order: 4,
        durationMinutes: 45,
        practiceFocus: 'Ni-Re-Ga-Ma(T)-Dha-Ni-Sa glide drills',
        ragasOrPieces: ['Raag Yaman']
      }
    ],
    assignments: [
      'Record 3-minute sustained Sa audio sample in Riyaaz Studio with pitch visualizer',
      'Submit video clapping Teentaal while singing Palta #4 in Dugun tempo',
      'Audio recording of Raag Yaman Bandish sthayi with Tanpura accompaniment'
    ]
  },
  {
    id: 'c-western-piano',
    name: 'Western Classical & Contemporary Piano',
    slug: 'western-classical-piano',
    title: 'Western Classical & Contemporary Piano',
    short_description: 'Grand staff reading, hand independence, classical sonatinas, and acoustic touch under Royal Academy pedagogy.',
    tagline: 'Grand staff reading, hand independence, and harmonic mastery.',
    description: 'Learn the piano as an expressive orchestral instrument. Our progressive curriculum combines Russian/European posture technique, sight-reading agility, finger autonomy, and a rich repertoire spanning Bach, Mozart, Chopin, and modern neoclassical masters.',
    image: 'https://images.unsplash.com/photo-1520523839898-507127025c83?auto=format&fit=crop&w=1000&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1520523839898-507127025c83?auto=format&fit=crop&w=1000&q=80',
    category: 'piano',
    instrument: 'piano',
    level: 'Foundation to Advanced',
    age_group: 'Kids (6+), Teens & Adults',
    ageGroup: 'Kids (6+), Teens & Adults',
    teacher: 'Julian Vance-Moreau',
    teacher_id: 't-julian',
    duration: '12 to 24 Weeks',
    class_duration: 45,
    sessionLengthMinutes: 45,
    number_of_classes: 12,
    sessionsCount: 12,
    sessionsPerWeek: 1,
    priceMonthly: 2499,
    currency: 'INR',
    active_status: true,
    package_id: 'pkg-std-1-1-4s-1m',
    featured: true,
    assessment: 'ABRSM/Trinity syllabus benchmarked video repertoire evaluation.',
    certificate: 'Saremi Conservatory Certificate in Classical Piano Performance.',
    curriculum: [
      {
        pillar: 'Pillar 1: Anatomical Posture & Touch',
        title: 'Anatomical Posture & Touch',
        topics: [
          'Bench height, arm weight, arched finger curvature & wrist flexibility',
          'Legato vs. Staccato touch mechanics without forearm tension',
          'Damper pedal timing and clean harmonic pedaling',
          'Tone color dynamics: Pianissimo (pp) to Fortissimo (ff)'
        ]
      },
      {
        pillar: 'Pillar 2: Grand Staff Sight-Reading',
        title: 'Grand Staff Sight-Reading',
        topics: [
          'Treble and Bass clef simultaneous interval recognition',
          'Rhythmic pulse, dotted notes, syncopation & rests',
          'Key signature circle of fifths & landmark note navigation',
          'Speed sight-reading drills on unfamiliar 8-measure scores'
        ]
      },
      {
        pillar: 'Pillar 3: Polyphony & Repertoire',
        title: 'Polyphony & Repertoire',
        topics: [
          'Bilateral hand independence exercises (Hanon & Czerny)',
          'J.S. Bach Notebook for Anna Magdalena & Inventions',
          'Clementi and Kuhlau Sonatinas (Allegro phrasing)',
          'Chopin Preludes & expressive romantic rubato'
        ]
      },
      {
        pillar: 'Pillar 4: Harmony, Lead Sheets & Chords',
        title: 'Harmony, Lead Sheets & Chords',
        topics: [
          'Major & minor triads, inversions, and voice leading',
          'Dominant 7th chords and harmonic cadence resolution',
          'Arranging pop and film themes from simple melody lead sheets',
          'Recorded semester concert performance piece'
        ]
      }
    ],
    modules: [
      {
        id: 'mod-p-1',
        courseId: 'c-western-piano',
        title: 'Module 1: Keyboard Geography & Posture (Weeks 1-3)',
        description: 'Ergonomic seating, hand arch, and learning the white and black key geography.',
        order: 1,
        learningObjectives: [
          'Establish correct arm-weight playing posture',
          'Identify all 88 keys without hesitation',
          'Play 5-finger patterns legato in C major'
        ]
      },
      {
        id: 'mod-p-2',
        courseId: 'c-western-piano',
        title: 'Module 2: The Grand Staff & Two-Hand Independence (Weeks 4-6)',
        description: 'Coordinating left-hand bass accompaniment with right-hand melodic phrases.',
        order: 2,
        learningObjectives: [
          'Read simultaneous treble and bass notes in 4/4 and 3/4 time',
          'Execute contrary motion scales',
          'Coordinate basic pedal changes on downbeats'
        ]
      }
    ],
    lessons: [
      {
        id: 'les-p-1',
        moduleId: 'mod-p-1',
        courseId: 'c-western-piano',
        title: 'Lesson 1: Arm Weight & The Curved Hand',
        summary: 'Eliminating finger collapse and playing through weight drop rather than muscle strain.',
        order: 1,
        durationMinutes: 45,
        practiceFocus: 'Drop-and-roll exercises on Middle C',
        ragasOrPieces: ['Hanon Exercise No. 1']
      }
    ],
    assignments: [
      'Submit overhead video demonstrating Hanon Exercise 1 at 60 BPM with relaxed wrists',
      'Sight-read and record 8 measures of Petzold Minuet in G'
    ]
  },
  {
    id: 'c-acoustic-guitar',
    name: 'Acoustic & Classical Guitar Mastery',
    slug: 'acoustic-classical-guitar',
    title: 'Acoustic & Classical Guitar Mastery',
    short_description: 'Fingerstyle polyphony, CAGED fretboard visualization, percussive acoustic grooves, and classical repertoire.',
    tagline: 'Fingerstyle polyphony, CAGED geometry, and expressive phrasing.',
    description: 'Master the acoustic guitar from fretboard anatomy to solo polyphony. Learn fingerpicking independence (thumb bass + finger melodies), fluid chord transitions, barre chords without pain, and Andalusian/classical etudes.',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1000&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1000&q=80',
    category: 'guitar',
    instrument: 'guitar',
    level: 'Foundation to Advanced',
    age_group: 'Kids (8+), Teens & Adults',
    ageGroup: 'Kids (8+), Teens & Adults',
    teacher: 'Matthew Reed',
    teacher_id: 't-matthew',
    duration: '12 to 24 Weeks',
    class_duration: 45,
    sessionLengthMinutes: 45,
    number_of_classes: 12,
    sessionsCount: 12,
    sessionsPerWeek: 1,
    priceMonthly: 2499,
    currency: 'INR',
    active_status: true,
    package_id: 'pkg-std-1-1-4s-1m',
    featured: true,
    assessment: 'Practical video submission of two contrasting solo acoustic pieces.',
    certificate: 'Saremi Conservatory Certificate in Acoustic Guitar Performance.',
    curriculum: [
      {
        pillar: 'Pillar 1: Fretting & Plucking Mechanics',
        title: 'Fretting & Plucking Mechanics',
        topics: [
          'Left hand thumb placement, fingertip perpendicularity & callus development',
          'PIMA classical right hand nomenclature & alternating i-m strokes',
          'Travis picking pattern & steady alternating bass groove',
          'Painless barre chord mastery via fret leverage mechanics'
        ]
      },
      {
        pillar: 'Pillar 2: CAGED Fretboard Architecture',
        title: 'CAGED Fretboard Architecture',
        topics: [
          'Connecting the 5 chord shapes across the entire neck',
          'Root note navigation on 6th and 5th strings',
          'Major and minor pentatonic soloing shapes',
          'Triads on the top three strings (G, B, high E)'
        ]
      }
    ],
    modules: [],
    lessons: [],
    assignments: [
      'Record steady Travis picking progression over C - Am - F - G at 72 BPM'
    ]
  },
  {
    id: 'c-classical-tabla',
    name: 'Classical Tabla & Tala Science',
    slug: 'classical-tabla-mastery',
    title: 'Classical Tabla & Tala Science',
    short_description: 'Benaras & Delhi gharana bols, crisp bayan modulation, and complex teentaal kayda architecture.',
    tagline: 'Benaras & Delhi gharana bols, crisp bayan modulation, and complex rhythmic mathematics.',
    description: 'Study under Pandit Aniruddha Mukherjee in the authentic Guru-Shishya tradition. Learn stroke clarity (Na, Tin, Ge, Dha, Dhin), wrist placement, Farukhabad and Benaras kaidas, peshkar, rela, and solo tihai engineering.',
    image: 'https://images.unsplash.com/photo-1541689592655-f5f52825a3b8?auto=format&fit=crop&w=1000&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1541689592655-f5f52825a3b8?auto=format&fit=crop&w=1000&q=80',
    category: 'tabla',
    instrument: 'tabla',
    level: 'Foundation to Advanced',
    age_group: 'Kids (7+), Teens & Adults',
    ageGroup: 'Kids (7+), Teens & Adults',
    teacher: 'Pt. Aniruddha Mukherjee',
    teacher_id: 't-aniruddha',
    duration: '12 to 24 Weeks',
    class_duration: 45,
    sessionLengthMinutes: 45,
    number_of_classes: 12,
    sessionsCount: 12,
    sessionsPerWeek: 1,
    priceMonthly: 2499,
    currency: 'INR',
    active_status: true,
    package_id: 'pkg-std-1-1-4s-1m',
    featured: true,
    assessment: 'Live 15-minute Teentaal solo performance evaluation before jury.',
    certificate: 'Saremi Conservatory Diploma in Classical Tala & Percussion.',
    curriculum: [
      {
        pillar: 'Pillar 1: Nikas & Stroke Acoustics',
        title: 'Nikas & Stroke Acoustics',
        topics: [
          'Dayan (right drum) kinara stroke precision: Na / Ta',
          'Syahi center resonance: Tin, Tun & open sustain',
          'Bayan (left bass) pressure slide: Ge and bass modulation',
          'Combined strokes: Dha and Dhin acoustic balance'
        ]
      }
    ],
    modules: [],
    lessons: [],
    assignments: [
      'Submit video reciting Teentaal theka with hand claps, then playing in Thah and Dugun'
    ]
  },
  {
    id: 'c-kids-explorer',
    name: 'Kids Music Explorer & Ear Training',
    slug: 'kids-music-explorer',
    title: 'Kids Music Explorer & Ear Training',
    short_description: 'Ages 5-12 playful conservatory initiation. Ear training, swara stories, rhythm games, and pitch matching.',
    tagline: 'Playful ear training, swara stories, and musical joy for young minds.',
    description: 'Designed specifically for young minds (ages 5 to 12). Using Kodály and Orff principles infused with joyful Indian swara storytelling, children develop perfect pitch awareness, rhythmic balance, and natural vocal poise through interactive 1:1 sessions.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
    category: 'kids',
    instrument: 'vocals',
    level: 'Foundation',
    age_group: 'Kids (5-12 Years)',
    ageGroup: 'Kids (5-12 Years)',
    teacher: 'Ananya Iyer',
    teacher_id: 't-ananya',
    duration: '12 Weeks',
    class_duration: 35,
    sessionLengthMinutes: 35,
    number_of_classes: 12,
    sessionsCount: 12,
    sessionsPerWeek: 1,
    priceMonthly: 2499,
    currency: 'INR',
    active_status: true,
    package_id: 'pkg-std-1-1-4s-1m',
    featured: true,
    assessment: 'Playful interactive recital of 3 swara songs and rhythm games.',
    certificate: 'Saremi Young Virtuoso Certificate of Music Exploration.',
    curriculum: [
      {
        pillar: 'Pillar 1: Swara Animal Friends & Ear Training',
        title: 'Swara Animal Friends & Ear Training',
        topics: [
          'Sa (Peacock), Re (Bull), Ga (Goat) musical storytelling',
          'High vs. Low pitch recognition through physical movement',
          'Echo singing and call-and-response vocal games'
        ]
      }
    ],
    modules: [],
    lessons: [],
    assignments: [
      'Record a voice note singing the 7 animal swara friends with teacher Ananya'
    ]
  }
];

export const TEACHER_AVAILABILITIES: TeacherAvailability[] = [
  { id: 'av-1', teacherId: 't-sunanda', dayOfWeek: 1, dayName: 'Monday', startTime: '10:00 AM', endTime: '1:00 PM', timezone: 'IST', isBooked: false },
  { id: 'av-2', teacherId: 't-sunanda', dayOfWeek: 3, dayName: 'Wednesday', startTime: '4:00 PM', endTime: '8:00 PM', timezone: 'IST', isBooked: false },
  { id: 'av-3', teacherId: 't-sunanda', dayOfWeek: 6, dayName: 'Saturday', startTime: '10:00 AM', endTime: '2:00 PM', timezone: 'IST', isBooked: false },
  { id: 'av-4', teacherId: 't-julian', dayOfWeek: 2, dayName: 'Tuesday', startTime: '2:00 PM', endTime: '6:00 PM', timezone: 'GMT', isBooked: false },
  { id: 'av-5', teacherId: 't-julian', dayOfWeek: 6, dayName: 'Saturday', startTime: '1:00 PM', endTime: '5:00 PM', timezone: 'GMT', isBooked: false },
  { id: 'av-6', teacherId: 't-aniruddha', dayOfWeek: 4, dayName: 'Thursday', startTime: '4:00 PM', endTime: '8:00 PM', timezone: 'IST', isBooked: false },
  { id: 'av-7', teacherId: 't-matthew', dayOfWeek: 1, dayName: 'Monday', startTime: '3:00 PM', endTime: '7:00 PM', timezone: 'EST', isBooked: false },
  { id: 'av-8', teacherId: 't-ananya', dayOfWeek: 6, dayName: 'Saturday', startTime: '9:00 AM', endTime: '1:00 PM', timezone: 'IST', isBooked: false }
];
