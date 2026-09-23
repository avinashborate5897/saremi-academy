import React from 'react';
import { useRouter } from '../../router/RouterContext';
import { Calendar, MapPin, CheckCircle, ArrowRight, Video, Trophy } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system';
import { ACADEMY_EVENTS } from '../../data/academyData';
import { SEOHead } from '../SEOHead';

interface EventsViewProps {
  onOpenBooking: () => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ onOpenBooking }) => {
  const { navigate } = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left space-y-10">
      <SEOHead
        title="Recitals, Concerts & Showcases"
        description="Celebrate the musical journey of Saremi Academy scholars. Annual global stream recitals, baithak chamber concerts, and student auditions."
        canonicalPath="/events"
      />

      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge variant="brass">Performance Opportunities</Badge>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#121829]">
          Recitals, Baithaks & Concert Showcases
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Music truly blossoms on the concert stage. Saremi produces regular virtual chamber baithaks, hybrid auditorium recitals, and jury auditions so students develop calm performance poise.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {ACADEMY_EVENTS.map(ev => (
          <Card key={ev.id} variant="default" padding="none" className="overflow-hidden flex flex-col justify-between">
            <div>
              <div className="relative aspect-16/9 overflow-hidden">
                <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3">
                  <Badge variant="brass" size="sm">{ev.category}</Badge>
                </div>
                <div className="absolute bottom-3 right-3 bg-[#121829]/80 backdrop-blur-xs text-[#FAF8F5] text-[11px] font-mono px-2.5 py-1 rounded-lg">
                  {ev.status}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-[#8C6428] font-bold">
                  <Calendar className="w-4 h-4" />
                  <span>{ev.date}</span>
                </div>

                <h3 className="font-serif text-2xl font-bold text-[#121829]">
                  {ev.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{ev.venue}</span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed pt-1">
                  {ev.description}
                </p>
              </div>
            </div>

            <div className="p-6 pt-0">
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-bold">
                  Auditions Open for All Level 2+ Scholars
                </span>
                <Button variant="brass" size="sm" onClick={() => navigate('/free-trial')}>
                  Apply to Perform
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
