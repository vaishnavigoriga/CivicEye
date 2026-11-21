import { ENV } from '../config/env';
import { ComplaintCategory } from '../models/Complaint';

export interface SeverityFactors {
  aiSeverityNormalized: number;  // 10 - 100
  populationImpact: number;      // 0 - 100
  safetyRisk: number;            // 0 or 100
  durationImpact: number;        // 0 - 100
}

export interface SeverityResult {
  priorityScore: number;         // 1 - 100
  factors: SeverityFactors;
  band: 'Critical' | 'High' | 'Medium' | 'Low';
  disclaimer: string;
}

const HIGH_RISK_CATEGORIES: ComplaintCategory[] = ['Drainage', 'Water Supply', 'Electricity'];

export class SeverityService {
  /**
   * Transparent 4-factor severity and priority calculation
   * Note: Older unresolved complaints receive a higher score (duration bonus), never a penalty.
   */
  static calculatePriority(
    aiSeverityRating: number,
    category: ComplaintCategory,
    upvotes: number = 0,
    createdAt: Date = new Date()
  ): SeverityResult {
    // 1. Raw AI Severity Signal (1-10) scaled to 10-100
    const rawAi = Math.max(1, Math.min(10, Math.round(aiSeverityRating)));
    const aiSeverityNormalized = rawAi * 10;

    // 2. Affected Population Impact (Upvotes as community proxy, 0-100)
    const populationImpact = Math.min(100, Math.max(0, upvotes * 5));

    // 3. Safety & Health Risk Flag (100 for high-risk hazards like open drains, live wires, water contamination)
    const safetyRisk = HIGH_RISK_CATEGORIES.includes(category) ? 100 : 0;

    // 4. Unresolved Duration Impact (Days since filing, 0-100)
    const now = new Date().getTime();
    const createdTime = new Date(createdAt).getTime();
    const daysUnresolved = Math.max(0, Math.floor((now - createdTime) / (1000 * 60 * 60 * 24)));
    const durationImpact = Math.min(100, daysUnresolved * 2);

    // Weighted combination using configurable weights
    const weightedSum =
      ENV.SEVERITY_WEIGHT_AI * aiSeverityNormalized +
      ENV.SEVERITY_WEIGHT_UPVOTES * populationImpact +
      ENV.SEVERITY_WEIGHT_SAFETY * safetyRisk +
      ENV.SEVERITY_WEIGHT_DURATION * durationImpact;

    // Clamp score strictly between 1 and 100
    const priorityScore = Math.max(1, Math.min(100, Math.round(weightedSum)));

    let band: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
    if (priorityScore >= 80) band = 'Critical';
    else if (priorityScore >= 60) band = 'High';
    else if (priorityScore >= 40) band = 'Medium';

    return {
      priorityScore,
      factors: {
        aiSeverityNormalized,
        populationImpact,
        safetyRisk,
        durationImpact,
      },
      band,
      disclaimer: 'Prototype estimate based on multi-factor analysis - not an official government assessment.',
    };
  }
}
