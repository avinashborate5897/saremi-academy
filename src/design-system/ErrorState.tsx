import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went off-key',
  message = 'We encountered an issue loading this section. Please try again.',
  onRetry,
  className = ''
}) => {
  return (
    <div className={`p-8 text-center rounded-2xl bg-rose-50/70 border border-rose-100 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-rose-100 text-[#DC2626] flex items-center justify-center mx-auto mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="font-serif text-base font-bold text-gray-900 mb-1">
        {title}
      </h4>
      <p className="text-xs text-gray-600 max-w-sm mx-auto mb-4">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
