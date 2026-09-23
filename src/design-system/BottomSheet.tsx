import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Content */}
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-300">
        {/* Drag handle pill */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h3 className="font-serif text-lg font-bold text-[#121829]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 bg-gray-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};
