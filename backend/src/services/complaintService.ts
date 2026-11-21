import { IComplaint } from '../models/Complaint';
import { calculateScore } from './scoringService';

/** Recomputes the stored prototype score from current data (supports, status, time open). */
export const rescore = (c: IComplaint): void => {
  const closed = c.status === 'resolved' || c.status === 'rejected';
  const s = calculateScore({
    category: c.verified?.category ?? c.category,
    safetyRisk: c.ai.severityFactors?.safetyRisk,
    affectedPopulation: c.ai.severityFactors?.affectedPopulation,
    infrastructureDamage: c.ai.severityFactors?.infrastructureDamage,
    hasImage: c.media.some((m) => m.kind === 'image'),
    supportCount: c.supportCount,
    createdAt: c.createdAt,
    closedAt: closed ? c.updatedAt : undefined,
  });
  c.scoring = { total: s.total, band: s.band, factors: s.factors, modelVersion: s.modelVersion, computedAt: new Date() };
};

export const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const trackingIdFor = (seq: number, year = new Date().getFullYear()): string => `CE-HYD-${year}-${String(seq).padStart(6, '0')}`;
