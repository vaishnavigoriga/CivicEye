import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftAddon, rightAddon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-800">
            {label}
            {props.required && <span className="text-rose-600 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
              {leftAddon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-md border text-sm transition-colors bg-white placeholder:text-slate-500 ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 text-rose-900'
                : 'border-slate-400 hover:border-slate-500 text-slate-900'
            } ${leftAddon ? 'pl-9' : 'pl-3'} ${rightAddon ? 'pr-9' : 'pr-3'} py-2 ${className}`}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 text-slate-400 flex items-center">
              {rightAddon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-sm text-rose-700" role="alert">{error}</p>
        ) : helperText ? (
          <p className="text-sm text-slate-600">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
