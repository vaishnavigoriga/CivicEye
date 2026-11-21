import React from 'react';
import { getSeverityInfo } from '../utils/severityColor';
import { AlertCircle } from 'lucide-react';

interface SeverityBadgeProps {
  score: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  score = 50,
  showScore = true,
  size = 'md',
}) => {
  const info = getSeverityInfo(score);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold border shadow-xs ${info.bgClass} ${info.textClass} ${info.borderClass} ${sizeClasses[size]}`}
    >
      <span
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ backgroundColor: info.hex }}
      />
      <span>{info.band} Severity</span>
      {showScore && <span className="opacity-80">({score}/100)</span>}
    </span>
  );
};
