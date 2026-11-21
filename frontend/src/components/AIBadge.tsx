import React from 'react';
import { Sparkles, Bot, AlertTriangle } from 'lucide-react';

interface AIBadgeProps {
  isSimulated?: boolean;
  source?: 'gemini' | 'mock';
  showDisclaimer?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AIBadge: React.FC<AIBadgeProps> = ({
  isSimulated = false,
  source = 'mock',
  showDisclaimer = false,
  className = '',
}) => {
  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border">
        {isSimulated || source === 'mock' ? (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border-amber-300">
            <Bot className="w-3.5 h-3.5 text-amber-600" />
            <span>Simulated AI Analysis</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 border-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Gemini 1.5 Flash</span>
          </span>
        )}
      </div>

      {showDisclaimer && (
        <p className="text-[10px] text-slate-500 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
          <span>Prototype estimate - not an official government assessment.</span>
        </p>
      )}
    </div>
  );
};
