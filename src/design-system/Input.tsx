import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-[#374151] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-gray-400 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full text-sm rounded-xl border bg-white px-3.5 py-2.5 transition-colors focus:outline-none min-h-[44px] ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${
            error
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]'
              : 'border-[#D1D5DB] focus:border-[#121829] focus:ring-1 focus:ring-[#121829]'
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-gray-400 pointer-events-none flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-[#DC2626]">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};
