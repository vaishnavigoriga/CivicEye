import { ENV } from '../config/env';
import { ComplaintCategory } from '../models/Complaint';

export const SCORING_MODEL_VERSION = 'prototype-v1';

export const SCORING_DISCLAIMER =
  'Prototype scoring model. It is not an officially validated municipal standard.';

export type SafetyRisk = 'low' | 'medium' | 'high' | 'critical';
export type AffectedPopulation = 'individual' | 'street' | 'neighbourhood' | 'ward';
export type InfrastructureDamage = 'cosmetic' | 'moderate' | 'severe' | 'collapsed';
export type Band = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ScoringInput {
  category: ComplaintCategory;
  /** AI suggestions about the situation (may come from the simulated analyser). */
  safetyRisk?: SafetyRisk;
  affectedPopulation?: AffectedPopulation;
  infrastructureDamage?: InfrastructureDamage;
  hasImage: boolean;
  /** Number of other citizens who have supported this complaint. */
  supportCount: number;
  createdAt: Date;
  /** Resolved or rejected complaints stop accumulating duration. */
  closedAt?: Date;
  now?: Date;
}

export interface ScoringResult {
  total: number; // 1-100
  band: Band;
  factors: { safety: number; affected: number; evidence: number; duration: number }; // each 0-1
  weights: { safety: number; affected: number; evidence: number; duration: number };
  modelVersion: string;
}

const SAFETY: Record<SafetyRisk, number> = { low: 0.2, medium: 0.5, high: 0.8, critical: 1 };
const AFFECTED: Record<AffectedPopulation, number> = { individual: 0.15, street: 0.4, neighbourhood: 0.7, ward: 1 };
const DAMAGE: Record<InfrastructureDamage, number> = { cosmetic: 0.1, moderate: 0.4, severe: 0.8, collapsed: 1 };

/** Minimum safety weighting by category, so inherently hazardous problems are never scored as harmless. */
const CATEGORY_SAFETY_FLOOR: Partial<Record<ComplaintCategory, number>> = {
  Electricity: 0.8,
  Drainage: 0.6,
  Waterlogging: 0.6,
  'Water Supply': 0.4,
  Roads: 0.4,
  'Public Infrastructure': 0.4,
};

export const bandFor = (total: number): Band => (total >= 80 ? 'Critical' : total >= 60 ? 'High' : total >= 40 ? 'Medium' : 'Low');

const normalisedWeights = () => {
  const w = {
    safety: ENV.SCORING_WEIGHT_SAFETY,
    affected: ENV.SCORING_WEIGHT_AFFECTED,
    evidence: ENV.SCORING_WEIGHT_EVIDENCE,
    duration: ENV.SCORING_WEIGHT_DURATION,
  };
  const sum = w.safety + w.affected + w.evidence + w.duration || 1;
  return { safety: w.safety / sum, affected: w.affected / sum, evidence: w.evidence / sum, duration: w.duration / sum };
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Transparent four-factor prototype score:
 *   safety risk, people affected, evidence severity, and how long the issue has been open.
 * The AI only supplies descriptive inputs; this function calculates the number.
 */
export const calculateScore = (input: ScoringInput): ScoringResult => {
  const now = input.now ?? new Date();
  const weights = normalisedWeights();

  const safety = clamp01(Math.max(SAFETY[input.safetyRisk ?? 'medium'], CATEGORY_SAFETY_FLOOR[input.category] ?? 0));
  // Each additional supporter adds a little, capped so supports cannot dominate.
  const affected = clamp01(AFFECTED[input.affectedPopulation ?? 'street'] + Math.min(0.3, input.supportCount * 0.05));
  const damage = DAMAGE[input.infrastructureDamage ?? 'moderate'];
  const evidence = clamp01(input.hasImage ? 0.4 + 0.6 * damage : 0.5 * damage);
  const end = input.closedAt ?? now;
  const days = Math.max(0, (end.getTime() - input.createdAt.getTime()) / 86_400_000);
  const duration = clamp01(days / ENV.SCORING_DURATION_SATURATION_DAYS);

  const raw = 100 * (weights.safety * safety + weights.affected * affected + weights.evidence * evidence + weights.duration * duration);
  const total = Math.max(1, Math.min(100, Math.round(raw)));

  return { total, band: bandFor(total), factors: { safety, affected, evidence, duration }, weights, modelVersion: SCORING_MODEL_VERSION };
};
