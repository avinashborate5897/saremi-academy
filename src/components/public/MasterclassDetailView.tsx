import React from 'react';
import { useRouter } from '../../router/RouterContext';
import { Calendar, Clock, CheckCircle, ArrowLeft, PlayCircle, Users, Award, Play } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system';
import { ACADEMY_MASTERCLASSES } from '../../data/academyData';
import { SEOHead } from '../SEOHead';
import { motion } from 'motion/react';

interface MasterclassDetailViewProps {
  id: string;
  onOpenBooking: () => void;
}

export const MasterclassDetailView: React.FC<MasterclassDetailViewProps> = ({ id, onOpenBooking }) => {
  const { navigate } = useRouter();
  const mc = ACADEMY_MASTERCLASSES.find(m => m.id === id) || ACADEMY_MASTERCLASSES[0];

  return (
    <div className="bg-saremi-bg min-h-screen pb-20">
      <SEOHead
        title={`${mc.title} | Saremi Masterclass`}
        description={mc.description}
        canonicalPath={`/masterclass/${mc.id}`}
      />
      
      {/* Hero Section */}
      <div className="relative w-full h-[60vh] sm:h-[70vh] bg-gray-900 overflow-hidden flex items-end">
        <div className="absolute inset-0">
          <img src={mc.image} alt={mc.title} className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20">
          <button onClick={() => navigate('/masterclasses')} className="flex items-center gap-2 text-gray-300 hover:text-white font-medium text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Masterclasses
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="brass">{mc.instrument}</Badge>
            <Badge variant={mc.status === 'upcoming' ? 'green' : 'purple'}>
              {mc.status === 'upcoming' ? 'Upcoming Live Session' : 'Recorded Replay Available'}
            </Badge>
          </div>
          
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight max-w-4xl">
            {mc.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-300 text-sm font-medium">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-saremi-yellow" />
              <span>{mc.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-saremi-yellow" />
              <span>{mc.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-saremi-yellow" />
              <span>{mc.duration}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-12">
        
        {/* Main Details */}
        <div className="flex-1 space-y-12">
          {/* Teacher Profile */}
          <div className="flex items-start gap-6 p-6 sm:p-8 bg-white rounded-[32px] shadow-sm border border-gray-100">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-100 shrink-0">
               <div className="w-full h-full flex items-center justify-center bg-saremi-soft-purple text-saremi-primary">
                 <Users className="w-10 h-10" />
               </div>
            </div>
            <div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{mc.maestro}</h3>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{mc.maestroTitle}</p>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-6">About the Masterclass</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {mc.description}
            </p>
          </div>

          <div>
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-6">Learning Outcomes</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {mc.topics.map((top, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-saremi-soft-yellow/30 border border-saremi-yellow/20">
                  <CheckCircle className="w-6 h-6 text-saremi-yellow shrink-0 mt-0.5" />
                  <span className="font-medium text-gray-800">{top}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Registration */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="sticky top-8">
            <Card variant="interactive" padding="xl" className="bg-white border-2 border-saremi-purple/20 shadow-xl">
              {mc.status === 'upcoming' ? (
                <>
                  <div className="text-center mb-8">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-widest block mb-2">Admission Fee</span>
                    <div className="font-serif text-5xl font-bold text-gray-900 mb-2">₹{mc.feeINR.toLocaleString('en-IN')}</div>
                    <p className="text-sm text-saremi-green font-bold">Free for Enrolled Scholars</p>
                  </div>
                  <Button variant="primary" size="lg" className="w-full mb-4" onClick={onOpenBooking}>
                    Register Now
                  </Button>
                  <p className="text-xs text-center text-gray-500 font-medium">Limited seats available for live diagnostic feedback.</p>
                </>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-widest block mb-2">Replay Access</span>
                    <div className="font-serif text-5xl font-bold text-gray-900 mb-2">₹{(mc.feeINR / 2).toLocaleString('en-IN')}</div>
                    <p className="text-sm text-saremi-green font-bold">Included in Vault Subscription</p>
                  </div>
                  <Button variant="secondary" size="lg" className="w-full mb-4" leftIcon={<Play className="w-5 h-5"/>} onClick={onOpenBooking}>
                    Purchase Replay
                  </Button>
                  <p className="text-xs text-center text-gray-500 font-medium">Instant lifetime access to the recorded session.</p>
                </>
              )}
            </Card>
          </div>
        </div>
        
      </div>
    </div>
  );
};
