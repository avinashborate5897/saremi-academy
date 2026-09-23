import React from 'react';
import { X } from 'lucide-react';
import { FreeDemoBookingForm } from './forms/FreeDemoBookingForm';

interface BookingModalProps {
  onClose: () => void;
  initialCourseTitle?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({ onClose, initialCourseTitle }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#0F0F0F]/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 relative text-left shadow-2xl border border-[#EAE5DB] my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#FAF8F5] hover:bg-[#F3EFEA] text-[#0F0F0F] flex items-center justify-center font-bold text-sm transition-colors cursor-pointer border border-[#E5E0D8]"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <FreeDemoBookingForm
          initialCourse={initialCourseTitle}
          onClose={onClose}
          isModal={true}
        />
      </div>
    </div>
  );
};
