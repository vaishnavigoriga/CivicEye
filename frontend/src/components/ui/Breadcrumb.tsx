import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 mb-4">
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link to="/" className="hover:text-civic-700 transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              {isLast || !item.href ? (
                <span className="font-semibold text-slate-800 truncate max-w-xs">{item.label}</span>
              ) : (
                <Link to={item.href} className="hover:text-civic-700 transition-colors truncate max-w-xs">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
