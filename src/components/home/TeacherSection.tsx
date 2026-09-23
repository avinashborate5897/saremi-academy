import React from 'react';
import { motion } from 'motion/react';
import { Button } from '../../design-system';
import { ArrowRight, Star } from 'lucide-react';

const teachers = [
  { id: 1, name: 'Ananya S.', instrument: 'Vocals & Harmonium', exp: '10+ Years', langs: 'English, Hindi', color: 'bg-pink-100', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=3&w=400&h=400&q=80' },
  { id: 2, name: 'Rohan M.', instrument: 'Tabla & Percussion', exp: '15+ Years', langs: 'English, Marathi', color: 'bg-orange-100', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=3&w=400&h=400&q=80' },
  { id: 3, name: 'Sarah J.', instrument: 'Piano & Theory', exp: '8+ Years', langs: 'English, French', color: 'bg-purple-100', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=3&w=400&h=400&q=80' },
];

export const TeacherSection: React.FC<{ onExploreTeachers: () => void }> = ({ onExploreTeachers }) => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl font-bold text-gray-900 mb-4">Meet Your Mentors</h2>
            <p className="text-gray-600 font-medium text-lg">Learn from performing artists and passionate educators who care about your growth.</p>
          </div>
          <Button variant="outline" size="md" onClick={onExploreTeachers} rightIcon={<ArrowRight className="w-4 h-4"/>}>
            See All Teachers
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teachers.map((t, idx) => (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[32px] border-2 border-gray-100 shadow-[0_8px_0_0_rgba(243,244,246,1)] overflow-hidden group cursor-pointer hover:-translate-y-2 transition-transform duration-300"
              onClick={onExploreTeachers}
            >
              <div className={`h-40 ${t.color} relative p-6 flex items-end justify-center`}>
                <img src={t.img} alt={t.name} className="w-32 h-32 rounded-full border-4 border-white shadow-lg absolute -bottom-16 object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="pt-20 pb-8 px-6 text-center">
                <h3 className="font-serif text-2xl font-bold text-gray-900 mb-1">{t.name}</h3>
                <p className="text-saremi-primary font-bold text-sm mb-4">{t.instrument}</p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-bold border border-gray-100">{t.exp} Experience</span>
                  <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-bold border border-gray-100">{t.langs}</span>
                </div>
                
                <div className="flex items-center justify-center gap-1 text-orange-500 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
