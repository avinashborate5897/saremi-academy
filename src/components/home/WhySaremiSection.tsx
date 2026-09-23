import React from 'react';
import { motion } from 'motion/react';
import { User, Clock, CalendarCheck, Award, Star } from 'lucide-react';

const reasons = [
  {
    title: "1:1 Personal Learning",
    desc: "Your teacher is focused only on you. No crowded group classes, just pure musical growth.",
    icon: <User className="w-8 h-8" />,
    color: "text-saremi-primary",
    bgColor: "bg-saremi-soft-purple",
    borderColor: "border-purple-200"
  },
  {
    title: "Learn at Your Pace",
    desc: "Speed up or slow down based on how you feel. We adapt our curriculum to your comfort.",
    icon: <Clock className="w-8 h-8" />,
    color: "text-saremi-secondary",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200"
  },
  {
    title: "Practice Every Day",
    desc: "Our interactive practice studio gives you the tools you need to stay on track daily.",
    icon: <CalendarCheck className="w-8 h-8" />,
    color: "text-saremi-green",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  {
    title: "Perform With Confidence",
    desc: "Join our digital showcases and build stage presence in a safe, encouraging environment.",
    icon: <Star className="w-8 h-8" />,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200"
  },
  {
    title: "Expert Teachers",
    desc: "Learn from vetted, experienced musicians who are passionate about teaching.",
    icon: <Award className="w-8 h-8" />,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  }
];

export const WhySaremiSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-4xl font-bold text-gray-900 mb-4">Why Saremi Academy?</h2>
          <p className="text-gray-600 font-medium text-lg">We believe learning music should be as joyful as playing it.</p>
        </div>
        
        <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-6 snap-x sm:snap-none hide-scrollbar">
          {reasons.map((reason, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="min-w-[280px] sm:min-w-0 snap-center bg-white rounded-[32px] p-8 border-2 border-gray-100 shadow-[0_8px_0_0_rgba(243,244,246,1)] hover:-translate-y-2 transition-transform duration-300"
            >
              <div className={`w-16 h-16 rounded-[24px] ${reason.bgColor} ${reason.color} border-2 ${reason.borderColor} flex items-center justify-center mb-6`}>
                {reason.icon}
              </div>
              <h3 className="font-serif text-xl font-bold text-gray-900 mb-3">{reason.title}</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed">{reason.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
