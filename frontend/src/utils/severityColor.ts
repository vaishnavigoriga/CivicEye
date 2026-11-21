export interface SeverityColorInfo {
  band: 'Critical' | 'High' | 'Medium' | 'Low';
  bgClass: string;
  textClass: string;
  borderClass: string;
  hex: string;
}

export const getSeverityInfo = (score: number = 50): SeverityColorInfo => {
  if (score >= 80) {
    return {
      band: 'Critical',
      bgClass: 'bg-red-50',
      textClass: 'text-red-700',
      borderClass: 'border-red-300',
      hex: '#EF4444',
    };
  }
  if (score >= 60) {
    return {
      band: 'High',
      bgClass: 'bg-orange-50',
      textClass: 'text-orange-700',
      borderClass: 'border-orange-300',
      hex: '#F97316',
    };
  }
  if (score >= 40) {
    return {
      band: 'Medium',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-300',
      hex: '#EAB308',
    };
  }
  return {
    band: 'Low',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-300',
    hex: '#10B981',
  };
};

export const getStatusBadgeInfo = (status: string) => {
  switch (status) {
    case 'resolved':
      return { label: 'Resolved', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'in-progress':
      return { label: 'In Progress', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'assigned':
      return { label: 'Assigned', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
    case 'rejected':
      return { label: 'Rejected', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
    case 'pending':
    default:
      return { label: 'Pending', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
  }
};
