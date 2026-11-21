import React from 'react';

export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({
  title,
  subtitle,
  actions,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="text-slate-600 mt-1 max-w-2xl">{subtitle}</p>}
    </div>
    {actions}
  </div>
);

export const Page: React.FC<{ children: React.ReactNode; narrow?: boolean }> = ({ children, narrow }) => (
  <div className={`mx-auto px-4 sm:px-6 py-8 ${narrow ? 'max-w-2xl' : 'max-w-6xl'}`}>{children}</div>
);
