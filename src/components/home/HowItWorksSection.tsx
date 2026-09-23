import React from 'react';
import { motion } from 'motion/react';
import { Play, UserPlus, Headphones, Star } from 'lucide-react';

const steps = [
  { id: 1, title: 'Choose Your Music', desc: 'Pick your favorite instrument or style.', icon: <Play className="w-8 h-8"/>, color: 'text-saremi-primary bg-saremi-soft-purple' },
  { id: 2, title: 'Meet Your Teacher', desc: 'Connect 1:1 with an expert guide.', icon: <UserPlus className="w-8 h-8"/>, color: 'text-saremi-secondary bg-pink-100' },
  { id: 3, title: 'Learn + Practice', desc: 'Use our app to practice every day.', icon: <Headphones className="w-8 h-8"/>, color: 'text-saremi-green bg-green-100' },
  { id: 4, title: 'Perform + Grow', desc: 'Showcase your skills confidently.', icon: <Star className="w-8 h-8"/>, color: 'text-orange-500 bg-orange-100' },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="font-serif text-4xl font-bold text-gray-900 mb-16">How It Works</h2>
        
        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-2 bg-gray-100 rounded-full" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-6">
            {steps.map((step, idx) => (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative flex flex-col items-center"
              >
                <div className={`w-24 h-24 rounded-[32px] ${step.color} border-4 border-white shadow-xl flex items-center justify-center mb-6 relative z-10`}>
                  {step.icon}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                    {step.id}
                  </div>
                </div>
                <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 font-medium max-w-[200px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
