import React from 'react';
import { motion } from 'motion/react';
import { Badge, Button } from '../../design-system';
import { Flame, Star, Trophy, Target, ArrowRight } from 'lucide-react';

export const StudentProgressPreview: React.FC = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <Badge variant="orange" className="mb-4">Gamified Learning</Badge>
            <h2 className="font-serif text-4xl font-bold text-gray-900 mb-6">Track Your Progress</h2>
            <p className="text-gray-600 font-medium text-lg mb-8 leading-relaxed">
              Watch your skills grow. Our student dashboard rewards consistency with streaks, badges, and clear skill trees. Learning music has never been this fun.
            </p>
            <Button variant="outline" size="lg" rightIcon={<ArrowRight className="w-5 h-5"/>} className="border-gray-200">
              See Student Experience
            </Button>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-saremi-bg p-6 sm:p-8 rounded-[40px] border-4 border-gray-100 shadow-[0_20px_0_0_rgba(243,244,246,1)] relative"
          >
            {/* Mock Dashboard UI */}
            <div className="flex items-center justify-between bg-white p-4 rounded-[24px] shadow-sm border-2 border-gray-100 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-saremi-soft-purple text-saremi-primary rounded-full flex items-center justify-center font-bold text-xl">
                  L
                </div>
                <div>
                  <div className="font-bold text-gray-900">Leo's Dashboard</div>
                  <div className="text-xs text-gray-500 font-bold uppercase">Level 2 Guitarist</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full border-2 border-orange-200">
                <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                <span className="font-bold text-orange-700">14 Days</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-5 rounded-[24px] shadow-sm border-2 border-gray-100 flex flex-col items-center justify-center text-center">
                <Target className="w-8 h-8 text-saremi-blue mb-2" />
                <div className="text-2xl font-bold text-gray-900">85%</div>
                <div className="text-xs font-bold text-gray-500 uppercase">To Next Level</div>
              </div>
              <div className="bg-white p-5 rounded-[24px] shadow-sm border-2 border-gray-100 flex flex-col items-center justify-center text-center">
                <Trophy className="w-8 h-8 text-saremi-yellow mb-2" />
                <div className="text-2xl font-bold text-gray-900">12</div>
                <div className="text-xs font-bold text-gray-500 uppercase">Badges Earned</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[24px] shadow-sm border-2 border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-gray-900">Recent Achievements</span>
              </div>
              <div className="flex gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-12 h-12 rounded-[16px] bg-saremi-soft-purple flex items-center justify-center border-2 border-purple-100 hover:scale-110 transition-transform cursor-pointer">
                    <Star className="w-6 h-6 text-saremi-secondary" />
                  </div>
                ))}
                <div className="w-12 h-12 rounded-[16px] bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200">
                  <Star className="w-6 h-6 text-gray-300" />
                </div>
              </div>
            </div>
            
          </motion.div>
          
        </div>
      </div>
    </section>
  );
};
