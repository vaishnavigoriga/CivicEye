import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) => {
  const styles = {
    info: {
      container: 'bg-blue-50/70 border-blue-200 text-blue-900',
      icon: <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />,
    },
    success: {
      container: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
      icon: <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />,
    },
    warning: {
      container: 'bg-amber-50/80 border-amber-300 text-amber-950',
      icon: <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />,
    },
    error: {
      container: 'bg-rose-50/70 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />,
    },
  };

  const current = styles[variant];

  return (
    <div
      className={`p-3.5 rounded-md border text-sm leading-relaxed flex items-start justify-between gap-3 ${current.container} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        {current.icon}
        <div>
          {title && <h5 className="font-bold text-slate-900 mb-0.5">{title}</h5>}
          <div>{children}</div>
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-700 p-0.5 -mr-1 rounded"
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
