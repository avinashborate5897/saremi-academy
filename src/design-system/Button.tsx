import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'brass' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-200 rounded-full focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97] active:translate-y-1 cursor-pointer';
  
  const sizeStyles = {
    sm: 'text-xs px-4 py-2 gap-1.5 min-h-[36px]',
    md: 'text-sm px-6 py-2.5 gap-2 min-h-[44px]', // touch-friendly 44px min
    lg: 'text-base px-8 py-3.5 gap-2.5 min-h-[50px]'
  }[size];

  // Adding playful 3D bottom borders and hover states
  const variantStyles = {
    primary: 'bg-saremi-primary text-white hover:brightness-110 border-b-4 border-[#5035C0] active:border-b-0 focus:ring-saremi-primary',
    secondary: 'bg-saremi-secondary text-white hover:brightness-110 border-b-4 border-[#D93F6A] active:border-b-0 focus:ring-saremi-secondary',
    brass: 'bg-saremi-yellow text-gray-900 hover:brightness-110 border-b-4 border-[#E5B922] active:border-b-0 focus:ring-saremi-yellow',
    outline: 'bg-white border-2 border-gray-200 text-gray-700 hover:border-saremi-primary hover:text-saremi-primary focus:ring-gray-200',
    ghost: 'text-gray-600 hover:bg-saremi-soft-purple hover:text-saremi-primary focus:ring-gray-200',
    danger: 'bg-red-500 text-white hover:brightness-110 border-b-4 border-red-700 active:border-b-0 focus:ring-red-500'
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
