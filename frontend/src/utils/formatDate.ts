import { format, formatDistanceToNow, isValid } from 'date-fns';

export const formatDate = (dateInput?: string | Date): string => {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (!isValid(d)) return 'N/A';
  return format(d, 'dd MMM yyyy, hh:mm a');
};

export const formatRelativeTime = (dateInput?: string | Date): string => {
  if (!dateInput) return 'Recently';
  const d = new Date(dateInput);
  if (!isValid(d)) return 'Recently';
  return formatDistanceToNow(d, { addSuffix: true });
};
