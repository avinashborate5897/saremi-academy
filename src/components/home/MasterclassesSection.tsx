import React from 'react';
import { motion } from 'motion/react';
import { Badge, Button } from '../../design-system';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

export const MasterclassesSection: React.FC = () => {
  return (
    <section className="py-24 bg-orange-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl font-bold text-gray-900 mb-4">Upcoming Masterclasses</h2>
            <p className="text-gray-600 font-medium text-lg">Learn directly from visiting maestros and industry legends.</p>
          </div>
          <Button variant="outline" size="md" rightIcon={<ArrowRight className="w-4 h-4"/>} className="border-orange-200 text-orange-700 bg-white hover:bg-orange-100">
            View Schedule
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-6 sm:p-8 rounded-[32px] border-2 border-orange-200 shadow-[0_8px_0_0_rgba(255,237,213,1)] flex flex-col sm:flex-row gap-6 items-center"
            >
              <img src={`https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=300&q=80&sig=${idx}`} alt="Maestro" className="w-24 h-24 sm:w-32 sm:h-32 rounded-[24px] object-cover shrink-0 shadow-sm" />
              <div className="flex-1 text-center sm:text-left">
                <Badge variant="pink" className="mb-3">Live Workshop</Badge>
                <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2">The Art of Improvisation</h3>
                <p className="text-gray-500 font-medium text-sm mb-4">Hosted by Ustad Ali Khan</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-bold text-gray-600">
                  <div className="flex items-center gap-1"><Calendar className="w-4 h-4 text-orange-500"/> Oct 24</div>
                  <div className="flex items-center gap-1"><Clock className="w-4 h-4 text-orange-500"/> 90 Mins</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
