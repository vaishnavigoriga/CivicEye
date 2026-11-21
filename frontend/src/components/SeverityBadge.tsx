import React from 'react';
import { getSeverityInfo } from '../utils/severityColor';
import { useLanguage } from '../contexts/LanguageContext';

interface SeverityBadgeProps {
  score: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ score = 50, showScore = true, size = 'md' }) => {
  const { t } = useLanguage();
  const info = getSeverityInfo(score);
  const sizes = { sm: 'px-1.5 py-0.5 text-[11px]', md: 'px-2 py-0.5 text-xs', lg: 'px-2.5 py-1 text-sm' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-medium ${info.bgClass} ${info.textClass} ${info.borderClass} ${sizes[size]}`}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.hex }} aria-hidden="true" />
      <span>{t.priority[info.band]}</span>
      {showScore && <span className="tabular-nums opacity-80">{score}/100</span>}
    </span>
  );
};
