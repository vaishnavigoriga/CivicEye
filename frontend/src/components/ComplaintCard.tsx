import React from 'react';
import { Link } from 'react-router-dom';
import { Complaint } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { AIBadge } from './AIBadge';
import { formatRelativeTime } from '../utils/formatDate';
import { MapPin, Calendar, Building2, Tag, Copy } from 'lucide-react';

interface ComplaintCardProps {
  complaint: Complaint;
  onUpvote?: (id: string) => void;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint }) => {
  const thumbnail = complaint.media?.find((m) => m.type === 'image')?.url;
  const displayId = complaint._id ? `CE-${complaint._id.slice(-6).toUpperCase()}` : 'CE-REF';

  return (
    <div className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Card Header Media or Category Strip */}
        {thumbnail ? (
          <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
            <img
              src={thumbnail}
              alt={complaint.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-civic-900/90 text-white backdrop-blur-xs">
                {complaint.category}
              </span>
            </div>
            <div className="absolute top-2.5 right-2.5">
              <StatusBadge status={complaint.status} size="sm" />
            </div>
          </div>
        ) : (
          <div className="p-4 pb-0 flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
              {complaint.category}
            </span>
            <StatusBadge status={complaint.status} size="sm" />
          </div>
        )}

        {/* Content Body */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <SeverityBadge score={complaint.aiAnalysis?.priorityScore || 50} size="sm" />
              <AIBadge isSimulated={complaint.aiAnalysis?.isSimulated} size="sm" />
            </div>
            <span className="text-[11px] font-mono text-slate-500 uppercase">{displayId}</span>
          </div>

          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-civic-700 transition-colors mb-1.5">
            <Link to={`/citizen/complaints/${complaint._id}`}>{complaint.title}</Link>
          </h3>

          <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed mb-3">
            {complaint.description}
          </p>

          {/* Location & Meta info */}
          <div className="space-y-1 text-xs text-slate-500 mb-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium text-slate-700">{complaint.location.area}</span>
              <span className="text-slate-400">•</span>
              <span className="truncate text-slate-500">{complaint.location.address}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{formatRelativeTime(complaint.createdAt)}</span>
              {complaint.department && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-teal-800 font-medium">
                    <Building2 className="w-3 h-3" />
                    {complaint.department.code || complaint.department.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          {complaint.aiAnalysis?.tags && complaint.aiAnalysis.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {complaint.aiAnalysis.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
                >
                  <Tag className="w-2.5 h-2.5 opacity-60" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Suspected duplicate notice indicator */}
          {complaint.duplicateGroupId && (
            <div className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Copy className="w-3 h-3" /> Grouped Duplicate
              </span>
              <span className="text-[10px] font-mono capitalize">
                {complaint.duplicateStatus || 'suspected'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          <strong className="text-slate-700 font-semibold">{complaint.upvotes || 0}</strong> citizens supported
        </span>
        <Link
          to={`/citizen/complaints/${complaint._id}`}
          className="font-medium text-civic-700 hover:text-civic-900 transition-colors"
        >
          View Case &rarr;
        </Link>
      </div>
    </div>
  );
};
