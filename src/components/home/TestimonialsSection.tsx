import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

const testimonials = [
  { id: 1, name: "Priya S.", role: "Student (Vocals)", text: "I never thought I could sing confidently. My mentor at Saremi completely changed how I approach music.", img: "https://i.pravatar.cc/150?img=47" },
  { id: 2, name: "David M.", role: "Parent", text: "My daughter looks forward to her piano class every week. The teachers are incredible and the app makes practice fun.", img: "https://i.pravatar.cc/150?img=68" },
  { id: 3, name: "Arjun K.", role: "Student (Guitar)", text: "The 1:1 attention means I learn exactly what I need. The practice studio tools are also super helpful for daily riyaaz.", img: "https://i.pravatar.cc/150?img=11" },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-4xl font-bold text-gray-900 mb-4">Loved by Students</h2>
          <p className="text-gray-600 font-medium text-lg">Join a community of joyful learners discovering their musical potential.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-saremi-bg p-8 rounded-[32px] border-2 border-gray-100 shadow-[0_8px_0_0_rgba(243,244,246,1)] flex flex-col"
            >
              <div className="flex gap-1 text-saremi-secondary mb-6">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-gray-700 font-medium text-lg leading-relaxed mb-8 flex-1">
                "{t.text}"
              </p>
              <div className="flex items-center gap-4 pt-6 border-t-2 border-gray-100">
                <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                <div>
                  <div className="font-bold text-gray-900">{t.name}</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
