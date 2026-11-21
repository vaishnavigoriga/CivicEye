import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { statusKey } from '../i18n';

const STYLES: Record<string, string> = {
  submitted: 'bg-slate-100 text-slate-800 border-slate-300',
  under_review: 'bg-amber-50 text-amber-900 border-amber-300',
  assigned: 'bg-indigo-50 text-indigo-900 border-indigo-300',
  in_progress: 'bg-blue-50 text-blue-900 border-blue-300',
  resolved: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  rejected: 'bg-rose-50 text-rose-900 border-rose-300',
};

export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const { t } = useLanguage();
  const key = statusKey(status);
  return (
    <span
      className={`inline-flex items-center rounded border font-medium ${STYLES[key]} ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'
      }`}
    >
      {t.status[key]}
    </span>
  );
};
