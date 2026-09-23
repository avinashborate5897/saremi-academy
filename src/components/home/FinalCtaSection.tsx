import React from 'react';
import { motion } from 'motion/react';
import { Button } from '../../design-system';
import { Play } from 'lucide-react';

export const FinalCtaSection: React.FC<{ onOpenBooking: () => void }> = ({ onOpenBooking }) => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-saremi-primary rounded-[48px] p-12 lg:p-20 text-center relative overflow-hidden shadow-[0_20px_0_0_rgba(243,244,246,1)] border-4 border-gray-100"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mt-20 -mr-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-saremi-secondary opacity-20 rounded-full -mb-10 -ml-10 blur-2xl" />
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Your Music Journey Starts Here.
          </h2>
          <p className="text-purple-100 text-lg sm:text-xl font-medium">
            Join thousands of students discovering their voice at Saremi Academy. Book your free trial today and meet your new favorite mentor.
          </p>
          <div className="pt-4">
            <Button variant="brass" size="lg" className="bg-saremi-yellow border-orange-500 text-orange-900 hover:bg-yellow-300 w-full sm:w-auto shadow-xl" onClick={onOpenBooking} leftIcon={<Play className="w-5 h-5 fill-current"/>}>
              Book a Free Trial
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
