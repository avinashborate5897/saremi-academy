import React from 'react';
import { motion } from 'motion/react';
import { Badge, Button } from '../../design-system';
import { Star, PlayCircle } from 'lucide-react';

export const PerformancesSection: React.FC = () => {
  return (
    <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-saremi-primary via-gray-900 to-gray-900" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="purple" className="mb-4 bg-white/10 text-saremi-secondary border-none">The Digital Stage</Badge>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold mb-4">Student Showcases</h2>
          <p className="text-gray-300 font-medium text-lg">Experience the thrill of performing for a global audience in our regular digital showcases.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gray-800 rounded-[32px] overflow-hidden group cursor-pointer border-2 border-gray-700 hover:border-saremi-primary transition-colors"
            >
              <div className="relative aspect-video bg-gray-700">
                <img src={`https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80&sig=${idx}`} alt="Performance" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="sky" size="sm" className="bg-saremi-blue/20 text-saremi-blue border-none">Winter Recital</Badge>
                  <span className="text-xs text-gray-400 font-bold">12:45</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-white">Classical Vocals Ensemble</h3>
                <p className="text-sm text-gray-400 mt-2 font-medium">Featuring 12 advanced students.</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
