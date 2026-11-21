import { calculateScore, bandFor } from '../services/scoringService';

const base = {
  category: 'Roads' as const,
  hasImage: false,
  supportCount: 0,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  now: new Date('2026-01-01T00:00:00Z'),
};

describe('scoringService (prototype model)', () => {
  it('score stays within 1-100 and factors within 0-1', () => {
    const max = calculateScore({
      ...base,
      safetyRisk: 'critical',
      affectedPopulation: 'ward',
      infrastructureDamage: 'collapsed',
      hasImage: true,
      supportCount: 50,
      now: new Date('2027-01-01'),
    });
    const min = calculateScore({ ...base, category: 'Other', safetyRisk: 'low', affectedPopulation: 'individual', infrastructureDamage: 'cosmetic' });
    expect(max.total).toBeLessThanOrEqual(100);
    expect(min.total).toBeGreaterThanOrEqual(1);
    for (const v of Object.values(max.factors)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('is monotonic in each input', () => {
    const lowRisk = calculateScore({ ...base, category: 'Other', safetyRisk: 'low' }).total;
    const highRisk = calculateScore({ ...base, category: 'Other', safetyRisk: 'critical' }).total;
    expect(highRisk).toBeGreaterThan(lowRisk);
    const noSupport = calculateScore(base).total;
    expect(calculateScore({ ...base, supportCount: 6 }).total).toBeGreaterThan(noSupport);
    expect(calculateScore({ ...base, hasImage: true }).total).toBeGreaterThan(noSupport);
  });

  it('duration raises the score while open and stops once closed', () => {
    const fresh = calculateScore(base).total;
    const old = calculateScore({ ...base, now: new Date('2026-02-01T00:00:00Z') }).total;
    expect(old).toBeGreaterThan(fresh);
    const closed = calculateScore({ ...base, closedAt: new Date('2026-01-01T00:00:00Z'), now: new Date('2026-06-01T00:00:00Z') }).total;
    expect(closed).toBe(fresh);
  });

  it('hazardous categories have a safety floor', () => {
    expect(calculateScore({ ...base, category: 'Electricity', safetyRisk: 'low' }).factors.safety).toBeGreaterThanOrEqual(0.8);
  });

  it('weights are reported and sum to 1', () => {
    const w = calculateScore(base).weights;
    expect(w.safety + w.affected + w.evidence + w.duration).toBeCloseTo(1, 5);
  });

  it('bands use fixed thresholds', () => {
    expect(bandFor(85)).toBe('Critical');
    expect(bandFor(60)).toBe('High');
    expect(bandFor(40)).toBe('Medium');
    expect(bandFor(39)).toBe('Low');
  });
});
