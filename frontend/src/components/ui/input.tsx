import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full border border-dashed border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-50 rounded-none ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
