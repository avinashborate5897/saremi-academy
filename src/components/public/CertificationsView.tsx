import React from 'react';
import { useRouter } from '../../router/RouterContext';
import { Award, CheckCircle, ShieldCheck, FileText, ArrowRight, Star } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system';
import { SEOHead } from '../SEOHead';

interface CertificationsViewProps {
  onOpenBooking: () => void;
}

export const CertificationsView: React.FC<CertificationsViewProps> = ({ onOpenBooking }) => {
  const { navigate } = useRouter();

  const levels = [
    {
      level: 'Conservatory Level 1',
      title: 'Prarambhik (Foundation Certificate)',
      duration: '4-6 Months of Study',
      assessment: '30-Minute Live Practical & Diagnostic',
      criteria: [
        'Acoustic swara matching within ±10 cents of Tanpura drone',
        'Kharaj riyaaz breath anchoring down to Mandra Nishad (Ni)',
        '10 Foundation Alankars in Shuddha Swaras',
        'Teentaal basic theka recitation and clapping at 60-80 BPM'
      ]
    },
    {
      level: 'Conservatory Level 2',
      title: 'Praveshika (Developing Scholar)',
      duration: '6-12 Months of Study',
      assessment: '45-Minute Live Performance & Viva Voce',
      criteria: [
        'Complete presentation of 2 foundational Ragas (e.g. Yaman, Bhairav)',
        'Chhota Khayal / Sonatina with Madhyalaya improvisation',
        'Layakari: Thah and Dugun execution without loss of pulse',
        'Sight-reading or swara identification from live guru dictation'
      ]
    },
    {
      level: 'Conservatory Level 3',
      title: 'Madhyama (Proficient Artist)',
      duration: '12-18 Months of Study',
      assessment: '60-Minute Live Jury Evaluation with External Maestro',
      criteria: [
        'Vilambit Bada Khayal / Classical Sonata with Bol-Alap structure',
        'Complex Layakari: Tigun and Chaugun with intricate Tihais',
        'Seasonal and Prakar Ragas with Pakad and subtle Swar Sthana nuances',
        '30-minute uninterrupted concert presentation'
      ]
    },
    {
      level: 'Conservatory Level 4',
      title: 'Visharad (Virtuoso Diploma)',
      duration: '18-24+ Months of Study',
      assessment: 'Full 75-Minute Concert Jury & Written Thesis/Viva',
      criteria: [
        'Full concert presentation before external Conservatory Jury Panel',
        'Ragamalika, Thumri, Dadra, or Advanced Classical Concerto',
        'Spontaneous Manodharma (extempore bol-taans and swar-vistar)',
        'Eligible for Conservatory Graduate Fellowship & Recital Headlining'
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left space-y-12">
      <SEOHead
        title="4-Pillar Graded Certification & Diplomas"
        description="Earn accredited diplomas benchmarked against classical conservatory frameworks. 4-Pillar grading, external jury evaluation, and verifiable digital transcripts."
        canonicalPath="/certifications"
      />

      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge variant="brass">Accredited Credentials</Badge>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#121829]">
          The 4-Pillar Conservatory Grading System
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Our certification is not a participation badge. It is a rigorous, peer-reviewed evaluation benchmarked against international classical standards, judged by visiting maestros.
        </p>
      </div>

      {/* 4 Levels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {levels.map((lvl, idx) => (
          <Card key={idx} variant="default" padding="lg" className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="brass" size="sm">{lvl.level}</Badge>
                <span className="text-[11px] font-mono text-gray-500">{lvl.duration}</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#121829]">{lvl.title}</h2>
              <span className="text-xs text-[#8C6428] font-mono font-semibold block">
                Exam: {lvl.assessment}
              </span>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <span className="text-[11px] font-mono text-gray-400 uppercase font-bold block">
                  Examination Criteria:
                </span>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  {lvl.criteria.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold"
                onClick={onOpenBooking}
              >
                Assess My Current Grade Level
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Diploma Features Strip */}
      <div className="p-8 rounded-3xl bg-[#121829] text-white space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <ShieldCheck className="w-7 h-7 text-[#D49A3D]" />
            <h3 className="font-serif text-lg font-bold">Cryptographically Verifiable</h3>
            <p className="text-xs text-gray-400">
              Every diploma comes with an immutable QR code and digital ID verifiable by university admissions and music conservatories worldwide.
            </p>
          </div>
          <div className="space-y-2">
            <FileText className="w-7 h-7 text-[#D49A3D]" />
            <h3 className="font-serif text-lg font-bold">Embossed Gold Parchment</h3>
            <p className="text-xs text-gray-400">
              Graduates of Level 2 and above receive an archival-grade, gold foil embossed certificate delivered to their home address.
            </p>
          </div>
          <div className="space-y-2">
            <Award className="w-7 h-7 text-[#D49A3D]" />
            <h3 className="font-serif text-lg font-bold">External Maestro Jury</h3>
            <p className="text-xs text-gray-400">
              Final evaluations are conducted not just by your regular teacher, but by an impartial external jury to guarantee artistic integrity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
