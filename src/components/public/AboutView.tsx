import React from 'react';
import { useRouter } from '../../router/RouterContext';
import { Heart, Award, Globe, Music, CheckCircle, Sparkles } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system';
import { SEOHead } from '../SEOHead';

interface AboutViewProps {
  onOpenBooking: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onOpenBooking }) => {
  const { navigate } = useRouter();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left space-y-12">
      <SEOHead
        title="Our Story & Pedagogical Philosophy"
        description="Learn about the origins of Saremi Academy, our mission to democratize live 1:1 conservatory music apprenticeship, and our 4-pillar pedagogical standard."
        canonicalPath="/about"
      />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge variant="brass">The Saremi Heritage</Badge>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#121829]">
          Bridging Ancient Apprenticeship with Modern Technology
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          We founded Saremi Academy to preserve the sanctity of the Guru-Shishya parampara while dismantling the geographic barriers that prevent dedicated learners from studying with real masters.
        </p>
      </div>

      {/* Story & Philosophy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <Badge variant="brass">The Origin</Badge>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121829]">
            The Lost Art of Direct Listening
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            In an era inundated with pre-recorded 3-minute video lessons and generic gamified apps, the core essence of music was being diluted. True musicality cannot be learned passively from a video screen; it demands an acoustic dialogue.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            A mentor must hear your breath. A mentor must see the subtle tension in your wrist before it turns into tendonitis. A mentor must notice that your Shuddha Gandhar (Ga) is resting 10 cents flat and gently guide your ear until the note rings with crystal resonance.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            At Saremi Academy, we built bespoke lossless audio classrooms, harmonic Tanpura drones, and our proprietary 4-Pillar Pedagogical Framework to make authentic 1:1 conservatory apprenticeship accessible anywhere in the world.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-xl border border-[#EAE5DB]">
          <img
            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80"
            alt="Classical instrument craftsmanship"
            className="w-full h-80 object-cover"
          />
        </div>
      </div>

      {/* 3 Core Tenets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="default" padding="lg" className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#EAE5DB] flex items-center justify-center text-[#8C6428]">
            <Music className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#121829]">Authentic Lineage</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Every teacher at Saremi is an auditioned performer representing storied lineages — from Banaras and Kirana gharanas to European royal conservatories.
          </p>
        </Card>

        <Card variant="default" padding="lg" className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#EAE5DB] flex items-center justify-center text-[#8C6428]">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#121829]">Global Accessibility</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Whether you are located in Tokyo, London, Toronto, or Mumbai, you receive the identical world-class conservatory training with timezone-optimized scheduling.
          </p>
        </Card>

        <Card variant="default" padding="lg" className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#EAE5DB] flex items-center justify-center text-[#8C6428]">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#121829]">Objective Rigor</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Our 4-Pillar syllabus provides unambiguous progression metrics. You always know exactly which scale, raag, or rhythmic cycle you are mastering.
          </p>
        </Card>
      </div>

      {/* Advisory & Final CTA */}
      <div className="p-8 sm:p-12 rounded-3xl bg-[#121829] text-white text-center space-y-6">
        <Badge variant="brass">Join Our Global Community</Badge>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold max-w-xl mx-auto">
          Over 1,200 Active Scholars in 24 Countries
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto">
          Experience the difference of live 1:1 guidance with a complimentary 45-minute diagnostic session.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="brass" size="lg" onClick={onOpenBooking}>
            Book Free Diagnostic Trial
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/courses')} className="border-white/20 text-white hover:bg-white/10">
            Explore Curriculum
          </Button>
        </div>
      </div>
    </div>
  );
};
