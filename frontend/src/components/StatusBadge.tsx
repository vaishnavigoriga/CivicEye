import React from 'react';
import { getStatusBadgeInfo } from '../utils/severityColor';
import { Clock, CheckCircle, RefreshCw, XCircle, ArrowRightCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const info = getStatusBadgeInfo(status);

  const getIcon = () => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'in-progress':
        return <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />;
      case 'assigned':
        return <ArrowRightCircle className="w-3.5 h-3.5 text-purple-600" />;
      case 'rejected':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'pending':
      default:
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${info.bg} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {getIcon()}
      <span>{info.label}</span>
    </span>
  );
};
