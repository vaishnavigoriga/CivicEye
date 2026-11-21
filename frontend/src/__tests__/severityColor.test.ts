import { describe, it, expect } from 'vitest';
import { getSeverityInfo, getStatusBadgeInfo } from '../utils/severityColor';

describe('Severity Color & Badge Calculation', () => {
  it('should return Critical band with red styling for scores 80 and above', () => {
    const info = getSeverityInfo(85);
    expect(info.band).toBe('Critical');
    expect(info.hex).toBe('#EF4444');
    expect(info.bgClass).toBe('bg-red-50');
  });

  it('should return High band for scores between 60 and 79', () => {
    const info = getSeverityInfo(65);
    expect(info.band).toBe('High');
    expect(info.hex).toBe('#F97316');
  });

  it('should return Medium band for scores between 40 and 59', () => {
    const info = getSeverityInfo(45);
    expect(info.band).toBe('Medium');
  });

  it('should return Low band for scores below 40', () => {
    const info = getSeverityInfo(25);
    expect(info.band).toBe('Low');
    expect(info.hex).toBe('#10B981');
  });

  it('should return accurate labels and classes for lifecycle statuses', () => {
    expect(getStatusBadgeInfo('resolved').label).toBe('Resolved');
    expect(getStatusBadgeInfo('in-progress').label).toBe('In Progress');
    expect(getStatusBadgeInfo('pending').label).toBe('Pending');
  });
});
