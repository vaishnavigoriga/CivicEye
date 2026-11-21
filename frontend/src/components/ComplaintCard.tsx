import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Complaint } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { ProvenanceBadge } from './ProvenanceBadge';
import { formatDate } from '../utils/formatDate';

export const ComplaintCard: React.FC<{ complaint: Complaint }> = ({ complaint: c }) => {
  const { t } = useLanguage();
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-slate-600">{c.trackingId}</span>
        <StatusBadge status={c.status} size="sm" />
      </div>
      <h3 className="font-medium leading-snug">
        <Link to={`/track/${c.trackingId}`} className="hover:text-civic-700 hover:underline">
          {c.title}
        </Link>
      </h3>
      <p className="text-sm text-slate-700 line-clamp-2">{c.description}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5">{t.categories[c.category]}</span>
        <SeverityBadge score={c.priority.score} size="sm" showScore={false} />
        <ProvenanceBadge source={c.provenance} />
      </div>
      <div className="mt-auto pt-2 text-sm text-slate-600 flex items-center gap-1.5 border-t border-slate-100">
        <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{c.location.area}</span>
        <span aria-hidden="true">·</span>
        <span className="whitespace-nowrap">{formatDate(c.createdAt).split(',')[0]}</span>
      </div>
    </article>
  );
};
