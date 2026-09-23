import React from 'react';
import { useRouter } from '../../router/RouterContext';
import { HeroSection } from '../home/HeroSection';
import { WhySaremiSection } from '../home/WhySaremiSection';
import { CourseExplorerSection } from '../home/CourseExplorerSection';
import { HowItWorksSection } from '../home/HowItWorksSection';
import { LearningJourneySection } from '../home/LearningJourneySection';
import { PracticeStudioPreview } from '../home/PracticeStudioPreview';
import { StudentProgressPreview } from '../home/StudentProgressPreview';
import { PerformancesSection } from '../home/PerformancesSection';
import { MasterclassesSection } from '../home/MasterclassesSection';
import { TestimonialsSection } from '../home/TestimonialsSection';
import { StoreSection } from '../home/StoreSection';
import { FinalCtaSection } from '../home/FinalCtaSection';

interface HomepageViewProps {
  onOpenBooking: () => void;
  onOpenAuth: () => void;
}

export const HomepageView: React.FC<HomepageViewProps> = ({ onOpenBooking, onOpenAuth }) => {
  const { navigate } = useRouter();

  const handleExploreCourses = () => {
    navigate('/courses');
  };

  return (
    <div className="w-full bg-white">
      <HeroSection 
        onOpenBooking={onOpenBooking} 
        onExploreCourses={handleExploreCourses} 
      />
      <WhySaremiSection />
      <CourseExplorerSection onExploreCourses={handleExploreCourses} />
      <HowItWorksSection />
      <LearningJourneySection />
      
      <PracticeStudioPreview />
      <StudentProgressPreview />
      
      <PerformancesSection />
      <MasterclassesSection />
      <StoreSection />
      <TestimonialsSection />
      
      <FinalCtaSection onOpenBooking={onOpenBooking} />
    </div>
  );
};
