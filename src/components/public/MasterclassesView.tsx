import React from 'react';
import { useRouter } from '../../router/RouterContext';
import { Calendar, Clock, CheckCircle, ArrowRight, Award, User, Sparkles } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system';
import { ACADEMY_MASTERCLASSES } from '../../data/academyData';
import { SEOHead } from '../SEOHead';

interface MasterclassesViewProps {
  onOpenBooking: () => void;
}

export const MasterclassesView: React.FC<MasterclassesViewProps> = ({ onOpenBooking }) => {
  const { navigate } = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left space-y-10">
      <SEOHead
        title="Visiting Maestro Masterclasses"
        description="Exclusive interactive masterclasses hosted by living legends of Indian classical and Western music. Live critique, microtonal nuances, and polyrhythmic geometry."
        canonicalPath="/masterclasses"
      />

      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge variant="brass">Maestro Series</Badge>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#121829]">
          Direct Guidance from Living Legends
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          In-depth 2.5-hour deep dives exploring advanced voice culture, rhythmic mathematics, and concert stage poise. All enrolled Conservatory Scholars receive priority seating.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {ACADEMY_MASTERCLASSES.map(mc => (
          <Card key={mc.id} variant="default" padding="none" className="overflow-hidden flex flex-col justify-between">
            <div>
              <div className="relative aspect-16/9 overflow-hidden">
                <img src={mc.image} alt={mc.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge variant="brass" size="sm">{mc.instrument}</Badge>
                  <Badge variant={mc.status === 'upcoming' ? 'green' : 'purple'} size="sm">
                    {mc.status === 'upcoming' ? 'Live Event' : 'Recorded'}
                  </Badge>
                </div>
                <div className="absolute bottom-3 right-3 bg-[#121829]/80 backdrop-blur-xs text-[#FAF8F5] text-[11px] font-mono px-2.5 py-1 rounded-lg">
                  {mc.duration}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                  <Calendar className="w-3.5 h-3.5 text-[#8C6428]" />
                  <span>{mc.date}</span>
                  <span>•</span>
                  <Clock className="w-3.5 h-3.5 text-[#8C6428]" />
                  <span>{mc.time}</span>
                </div>

                <h3 className="font-serif text-2xl font-bold text-[#121829] leading-snug">
                  {mc.title}
                </h3>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DB]">
                  <strong className="text-xs font-bold text-gray-900 block">{mc.maestro}</strong>
                  <span className="text-[11px] text-gray-500 block">{mc.maestroTitle}</span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {mc.description}
                </p>

                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <span className="text-[11px] font-mono text-gray-400 uppercase font-bold block">
                    Curriculum Highlights:
                  </span>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    {mc.topics.map((top, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{top}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 block font-mono">Admission Fee</span>
                  <span className="font-serif text-lg font-bold text-[#121829]">
                    ₹{mc.feeINR.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium block">
                    Free for Conservatory Scholars
                  </span>
                </div>
                <Button variant="brass" size="md" onClick={() => navigate(`/masterclass/${mc.id}`)}>
                  View Details & Register
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
