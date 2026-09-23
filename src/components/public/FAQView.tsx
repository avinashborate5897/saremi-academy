import React, { useState } from 'react';
import { useRouter } from '../../router/RouterContext';
import { ChevronDown, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system';
import { ACADEMY_FAQS } from '../../data/academyData';
import { SEOHead } from '../SEOHead';

interface FAQViewProps {
  onOpenBooking: () => void;
}

export const FAQView: React.FC<FAQViewProps> = ({ onOpenBooking }) => {
  const { navigate } = useRouter();
  const [activeIdx, setActiveIdx] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Pedagogy & Classes', 'Equipment & Prerequisites', 'Scheduling & Policies', 'Grading & Certifications', 'Kids & Parents'];

  const filteredFaqs = selectedCategory === 'All'
    ? ACADEMY_FAQS
    : ACADEMY_FAQS.filter(f => f.category === selectedCategory);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": ACADEMY_FAQS.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left space-y-8">
      <SEOHead
        title="Frequently Asked Questions (FAQ)"
        description="Got questions about 1:1 live music classes, instruments, rescheduling policies, and graded diplomas at Saremi Academy? Find clear answers here."
        canonicalPath="/faq"
        schema={faqSchema}
      />

      <div className="text-center max-w-2xl mx-auto space-y-3">
        <Badge variant="brass">Help Center & Clarity</Badge>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#121829]">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Everything you need to know about our pedagogy, scheduling flexibility, equipment requirements, and certification.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[44px] flex items-center ${
              selectedCategory === cat
                ? 'bg-[#121829] text-white shadow-xs'
                : 'bg-white border border-[#EAE5DB] text-gray-700 hover:border-gray-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => (
          <Card
            key={idx}
            variant="interactive"
            padding="md"
            onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
          >
            <div className="flex items-center justify-between font-serif font-bold text-sm sm:text-base text-[#121829]">
              <span className="pr-4">{faq.question}</span>
              <span className="text-base text-[#D49A3D] font-mono font-bold shrink-0">
                {activeIdx === idx ? '−' : '+'}
              </span>
            </div>
            {activeIdx === idx && (
              <p className="mt-3 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 font-sans">
                {faq.answer}
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Contact CTA */}
      <Card variant="default" padding="lg" className="bg-[#FAF8F5] border-[#D49A3D] text-center space-y-3">
        <h3 className="font-serif text-xl font-bold text-[#121829]">Still have a specific question?</h3>
        <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
          Our admissions advisors are happy to walk you through syllabus placement or recommend an instrument.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="brass" size="md" onClick={onOpenBooking}>
            Book Free Diagnostic Trial
          </Button>
          <Button variant="outline" size="md" onClick={() => navigate('/contact')}>
            Contact Admissions Desk
          </Button>
        </div>
      </Card>
    </div>
  );
};
