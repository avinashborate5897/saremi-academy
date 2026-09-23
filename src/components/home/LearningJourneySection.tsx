import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Star, Music, Award, Mic, Zap } from 'lucide-react';
import { Badge } from '../../design-system';

const milestones = [
  { level: 'Beginner', title: 'The First Note', desc: 'Learn the basics of sound and rhythm.', icon: <Mic className="w-5 h-5"/>, color: 'bg-blue-100 text-blue-600' },
  { level: 'Intermediate', title: 'Finding Rhythm', desc: 'Play your first full songs with confidence.', icon: <Music className="w-5 h-5"/>, color: 'bg-green-100 text-green-600' },
  { level: 'Advanced', title: 'Mastering Technique', desc: 'Complex compositions and improvisations.', icon: <Zap className="w-5 h-5"/>, color: 'bg-purple-100 text-purple-600' },
  { level: 'Performance', title: 'Taking the Stage', desc: 'Live showcases and digital performances.', icon: <Star className="w-5 h-5"/>, color: 'bg-orange-100 text-orange-600' },
  { level: 'Certification', title: 'Saremi Graduate', desc: 'Official certification of your musical mastery.', icon: <Award className="w-5 h-5"/>, color: 'bg-yellow-100 text-yellow-600' },
];

export const LearningJourneySection: React.FC = () => {
  return (
    <section className="py-24 bg-saremi-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="purple" className="mb-4">Clear Progression</Badge>
          <h2 className="font-serif text-4xl font-bold text-gray-900 mb-4">A Clear Path to Mastery</h2>
          <p className="text-gray-600 font-medium text-lg">Watch yourself grow from a curious beginner to a certified performer.</p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Line (Mobile) / Horizontal Line (Desktop) */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-200 rounded-full lg:left-0 lg:right-0 lg:top-1/2 lg:bottom-auto lg:h-1 lg:-translate-y-1/2" />
          
          <div className="flex flex-col lg:flex-row justify-between gap-8 lg:gap-4 relative z-10">
            {milestones.map((m, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="flex lg:flex-col items-center gap-6 lg:gap-4"
              >
                <div className={`w-16 h-16 shrink-0 rounded-[20px] ${m.color} border-4 border-white shadow-md flex items-center justify-center relative z-10`}>
                  {m.icon}
                </div>
                <div className="lg:text-center flex-1 bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 w-full">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{m.level}</div>
                  <h4 className="font-serif text-lg font-bold text-gray-900 mb-1">{m.title}</h4>
                  <p className="text-sm font-medium text-gray-500">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
