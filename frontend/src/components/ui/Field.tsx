import React from 'react';

interface FieldShellProps {
  label?: string;
  error?: string;
  helperText?: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}

const FieldShell: React.FC<FieldShellProps> = ({ label, error, helperText, htmlFor, required, children }) => (
  <div className="w-full space-y-1">
    {label && (
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-800">
        {label}
        {required && (
          <span className="text-rose-600 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
    )}
    {children}
    {error ? (
      <p className="text-sm text-rose-700" role="alert">
        {error}
      </p>
    ) : helperText ? (
      <p className="text-sm text-slate-600">{helperText}</p>
    ) : null}
  </div>
);

const controlClass = (error?: string) =>
  `w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 ${
    error ? 'border-rose-500' : 'border-slate-400 hover:border-slate-500'
  }`;

type CommonProps = { label?: string; error?: string; helperText?: string };

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & CommonProps
>(({ label, error, helperText, className = '', id, ...props }, ref) => {
  const fid = id || `ta-${label?.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <FieldShell label={label} error={error} helperText={helperText} htmlFor={fid} required={props.required}>
      <textarea id={fid} ref={ref} aria-invalid={!!error} className={`${controlClass(error)} ${className}`} {...props} />
    </FieldShell>
  );
});
TextArea.displayName = 'TextArea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & CommonProps
>(({ label, error, helperText, className = '', id, children, ...props }, ref) => {
  const fid = id || `sel-${label?.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <FieldShell label={label} error={error} helperText={helperText} htmlFor={fid} required={props.required}>
      <select id={fid} ref={ref} aria-invalid={!!error} className={`${controlClass(error)} ${className}`} {...props}>
        {children}
      </select>
    </FieldShell>
  );
});
Select.displayName = 'Select';
