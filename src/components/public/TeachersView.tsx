import React, { useState, useMemo } from 'react';
import { useRouter } from '../../router/RouterContext';
import {
  Star,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Award,
  ChevronRight,
  Search,
  Filter,
  Play,
  PlayCircle,
  Globe,
  BookOpen,
  ShieldCheck,
  Video
} from 'lucide-react';
import { Button, Card, Badge } from '../../design-system';
import { TEACHERS_DATA, COURSES_DATA } from '../../data/coursesData';
import { TeacherProfile } from '../../types';
import { SEOHead } from '../SEOHead';

interface TeachersViewProps {
  onOpenBooking: () => void;
  teacherId?: string;
}

export const TeachersView: React.FC<TeachersViewProps> = ({ onOpenBooking, teacherId }) => {
  const { navigate } = useRouter();
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);

  // -------------------------------------------------------------
  // DIRECTORY VIEW: /teachers filter
  // -------------------------------------------------------------
  const filteredTeachers = useMemo(() => {
    return TEACHERS_DATA.filter((teacher) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        teacher.name.toLowerCase().includes(q) ||
        teacher.specialization.toLowerCase().includes(q) ||
        teacher.tradition?.toLowerCase().includes(q) ||
        teacher.languages.some((l) => l.toLowerCase().includes(q));

      const matchesDiscipline =
        selectedDiscipline === 'all' ||
        teacher.specialization.toLowerCase().includes(selectedDiscipline.toLowerCase());

      return matchesSearch && matchesDiscipline;
    });
  }, [searchQuery, selectedDiscipline]);

  // -------------------------------------------------------------
  // DETAIL SUBVIEW: /teacher/:id
  // -------------------------------------------------------------
  if (teacherId) {
    const teacher = TEACHERS_DATA.find((t) => t.id === teacherId) || TEACHERS_DATA[0];
    const taughtCourses = COURSES_DATA.filter(
      (c) => teacher.courses.includes(c.slug) || c.teacher_id === teacher.id || c.teacher === teacher.name
    );

    const teacherSchema = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": teacher.name,
      "jobTitle": teacher.title,
      "worksFor": {
        "@type": "EducationalOrganization",
        "name": "Saremi Academy"
      },
      "description": teacher.bio
    };

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left">
        <SEOHead
          title={`${teacher.name} - Faculty Profile | Saremi Academy`}
          description={teacher.bio}
          canonicalPath={`/teacher/${teacher.id}`}
          schema={teacherSchema}
        />

        <button
          onClick={() => navigate('/teachers')}
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-1.5 cursor-pointer group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Back to Faculty Directory
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Faculty Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Header / Hero */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EAE5DB] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="relative shrink-0">
                  <img
                    src={teacher.photo}
                    alt={teacher.name}
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-2 border-[#D49A3D] shadow-md"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-[#121829] text-[#D49A3D] px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border border-[#D49A3D]/40 flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-[#D49A3D]" />
                    {teacher.rating}
                  </div>
                </div>

                <div className="space-y-2">
                  <Badge variant="brass">{teacher.specialization}</Badge>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#121829]">
                    {teacher.name}
                  </h1>
                  <p className="text-xs font-mono text-[#8C6428] font-bold">
                    {teacher.title}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    Artistic Lineage: <strong className="text-gray-800">{teacher.tradition}</strong>
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-gray-600 font-mono">
                    <span>🎓 {teacher.experience} Years Experience</span>
                    <span>🗣️ {teacher.languages.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <h3 className="font-serif text-base font-bold text-[#121829]">
                  Pedagogical Biography & Lineage
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed font-sans">
                  {teacher.bio}
                </p>
              </div>
            </div>

            {/* Intro Video Player / Showcase */}
            <div className="p-6 rounded-3xl bg-[#121829] text-white space-y-4 border border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#D49A3D]" />
                  <h3 className="font-serif text-lg font-bold">
                    Faculty Introduction & Demonstration
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">
                  Verified Acoustic Audio
                </span>
              </div>

              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center group">
                {!isPlayingVideo ? (
                  <>
                    <img
                      src={teacher.photo}
                      alt={teacher.name}
                      className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    <button
                      onClick={() => setIsPlayingVideo(true)}
                      className="relative z-10 w-16 h-16 rounded-full bg-[#D49A3D] text-[#121829] flex items-center justify-center shadow-xl hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </button>
                    <div className="absolute bottom-4 left-4 text-xs font-mono text-white/80">
                      Click to watch 1:1 acoustic teaching preview
                    </div>
                  </>
                ) : (
                  <video
                    src={teacher.intro_video}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>

            {/* Academic Qualifications & Accreditations */}
            <div className="p-6 rounded-3xl bg-white border border-[#EAE5DB] shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#121829] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#8C6428]" />
                Formal Qualifications & Pedigree
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teacher.qualifications.map((q, i) => (
                  <div key={i} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE5DB] flex items-start gap-2.5 text-xs text-gray-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Courses Taught by This Teacher */}
            {taughtCourses.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-[#121829]">
                  Courses Mentored by {teacher.name.split(' ')[0]}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {taughtCourses.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/course/${c.slug}`)}
                      className="p-4 rounded-2xl bg-white border border-[#EAE5DB] hover:border-[#D49A3D] transition-all cursor-pointer shadow-xs flex items-center gap-3 group"
                    >
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-[#8C6428] font-bold uppercase">{c.level}</span>
                        <h4 className="font-serif text-sm font-bold text-[#121829] group-hover:text-[#8C6428] transition-colors line-clamp-1">
                          {c.name}
                        </h4>
                        <span className="text-[11px] text-gray-500 font-mono block">View Syllabus →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student Reviews */}
            {teacher.reviews && teacher.reviews.length > 0 && (
              <div className="p-6 rounded-3xl bg-white border border-[#EAE5DB] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-[#121829]">
                    Verified Student Testimonials
                  </h3>
                  <span className="text-xs font-mono text-[#8C6428] font-bold">
                    {teacher.reviewCount || teacher.reviews.length} reviews ({teacher.rating} / 5.0)
                  </span>
                </div>

                <div className="space-y-3">
                  {teacher.reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE5DB] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-gray-900 font-semibold">{rev.studentName}</strong>
                        <div className="flex items-center gap-0.5">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-[#D49A3D] fill-[#D49A3D]" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 italic">"{rev.comment}"</p>
                      <span className="text-[10px] text-gray-400 font-mono block">{rev.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Weekly Availability & Booking CTA */}
          <div className="lg:col-span-4 space-y-6">
            <Card variant="default" padding="lg" className="sticky top-20 space-y-6 border-[#D49A3D]/40 shadow-lg">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8C6428] font-bold block mb-1">
                  1:1 Live Mentorship
                </span>
                <h3 className="font-serif text-xl font-bold text-[#121829]">
                  Book Trial with {teacher.name.split(' ')[0]}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Claim your complimentary 45-minute diagnostic evaluation.
                </p>
              </div>

              {/* Weekly Slots */}
              <div className="space-y-2.5">
                <span className="text-xs font-mono font-bold text-gray-700 block uppercase text-[10px]">
                  Available Teaching Windows
                </span>
                <div className="space-y-2">
                  {teacher.availability.map((slot, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedSlot === slot
                          ? 'border-[#D49A3D] bg-[#FAF8F5] ring-1 ring-[#D49A3D]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{slot}</span>
                        <Clock className="w-3.5 h-3.5 text-[#8C6428]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE5DB] text-xs text-gray-600 space-y-1">
                <span className="font-bold text-[#121829] block">100% Free Diagnostic Trial</span>
                <p className="text-[11px] text-gray-500">
                  Assess vocal range, hand anatomy, and musical goals in a high-definition Agora live acoustic studio.
                </p>
              </div>

              <Button
                variant="brass"
                size="lg"
                className="w-full text-sm font-bold shadow-md cursor-pointer"
                onClick={onOpenBooking}
              >
                Book Free Trial with Guru →
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero obligation • No payment details required</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DIRECTORY VIEW: /teachers
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left">
      <SEOHead
        title="1:1 Faculty Mentorship & Guru Allocation | Saremi Academy"
        description="Learn 1:1 with certified conservatory maestros. Our academic dean matches each student with a dedicated mentor tailored to their goals and schedule."
        canonicalPath="/teachers"
      />

      {/* HEADER */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
        <Badge variant="brass">Personalized Mentorship Model</Badge>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#121829] tracking-tight">
          1:1 Dedicated Faculty & Mentorship
        </h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-sans">
          Rather than static group classes or generic listings, Saremi Academy assigns certified performing maestros individually to each student based on musical discipline, skill level, and weekly schedule availability.
        </p>
      </div>

      {/* 4 PILLARS OF OUR FACULTY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <div className="p-6 rounded-3xl bg-white border border-[#EAE5DB] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#D49A3D] flex items-center justify-center font-bold text-xl">
            🎓
          </div>
          <h3 className="font-serif text-lg font-bold text-[#121829]">Auditioned Maestros</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Every faculty member undergoes a rigorous 4-step pedagogical audition, ensuring mastery in authentic Gharana traditions and conservatory methodologies.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#EAE5DB] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl">
            🎯
          </div>
          <h3 className="font-serif text-lg font-bold text-[#121829]">100% Focused 1:1 Live</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Zero crowded batches. Your guru listens to every microtone, breath modulation, and fingering nuance in real-time high-fidelity audio.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#EAE5DB] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
            🔄
          </div>
          <h3 className="font-serif text-lg font-bold text-[#121829]">Dedicated Continuity</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            You learn with the same dedicated guru week after week, ensuring steady musical progression, accountability, and customized practice plans.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#EAE5DB] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
            ✨
          </div>
          <h3 className="font-serif text-lg font-bold text-[#121829]">Matched Post-Trial</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            During your complimentary 30-min diagnostic trial, we evaluate your vocal pitch or instrument familiarity before pairing you with the ideal mentor.
          </p>
        </div>
      </div>

      {/* HOW MENTOR ALLOCATION WORKS */}
      <div className="p-8 sm:p-12 rounded-3xl bg-[#121829] text-white mb-8 relative overflow-hidden">
        <div className="max-w-2xl space-y-5 relative z-10">
          <Badge variant="brass">How It Works</Badge>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold">
            How Your Dedicated Guru is Assigned
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            We believe the guru-shishya relationship is sacred. Here is our 3-step student-teacher onboarding pathway:
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#D49A3D] text-[#121829] flex items-center justify-center font-mono font-bold text-xs shrink-0">1</span>
              <div>
                <strong className="text-sm font-bold block text-white">Book Free 30-Min Diagnostic Trial</strong>
                <span className="text-xs text-gray-300">Experience a 1:1 session with senior faculty to assess your vocal range or instrument goals.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#D49A3D] text-[#121829] flex items-center justify-center font-mono font-bold text-xs shrink-0">2</span>
              <div>
                <strong className="text-sm font-bold block text-white">Dean Evaluates & Pairs Mentor</strong>
                <span className="text-xs text-gray-300">We match your chosen days, time slot, preferred languages, and musical aspirations with the best-fit verified guru.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#D49A3D] text-[#121829] flex items-center justify-center font-mono font-bold text-xs shrink-0">3</span>
              <div>
                <strong className="text-sm font-bold block text-white">Begin Guided Learning & Riyaaz Tracking</strong>
                <span className="text-xs text-gray-300">Your assigned guru appears directly in your student portal with personalized notes, recordings, and class links.</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-4">
            <Button variant="brass" size="lg" onClick={onOpenBooking}>
              Book a Free Diagnostic Trial
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/courses')} className="border-white/20 text-white hover:bg-white/10">
              Explore All Courses
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
