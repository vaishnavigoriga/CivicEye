import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Provenance } from '../types';

/** Shows where a record came from. DEMO records are always visibly labelled. */
export const ProvenanceBadge: React.FC<{ source?: Provenance; size?: 'sm' | 'md' }> = ({ source = 'CITIZEN', size = 'sm' }) => {
  const { t } = useLanguage();
  const style =
    source === 'DEMO'
      ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold tracking-wide'
      : source === 'IMPORTED_OFFICIAL'
      ? 'bg-teal-50 text-teal-900 border-teal-300'
      : 'bg-civic-50 text-civic-900 border-civic-100';
  return (
    <span
      title={source === 'DEMO' ? t.provenance.demoHint : undefined}
      className={`inline-flex items-center rounded border ${style} ${size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'}`}
    >
      {t.provenance[source]}
    </span>
  );
};
