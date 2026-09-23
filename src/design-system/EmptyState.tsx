import React from 'react';
import { Music } from 'lucide-react';
import { Button } from './Button';
import { motion } from 'motion/react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-[32px] bg-saremi-bg border-4 border-dashed border-gray-200/60 ${className}`}>
      <motion.div 
        animate={{ y: [-5, 5, -5] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="w-20 h-20 rounded-[28px] bg-white shadow-[0_8px_0_0_rgba(243,244,246,1)] border-2 border-gray-100 flex items-center justify-center mx-auto mb-6 text-saremi-secondary"
      >
        {icon || <Music className="w-10 h-10" />}
      </motion.div>
      <h4 className="font-serif text-2xl font-bold text-gray-900 mb-2">
        {title}
      </h4>
      <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto mb-8">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
