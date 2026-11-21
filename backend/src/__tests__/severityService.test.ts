import { SeverityService } from '../services/severityService';

describe('SeverityService (Transparent Multi-Factor Scoring)', () => {
  it('should calculate priority score accurately for critical water hazard', () => {
    // Water Supply is high-risk (safetyRisk = 100)
    const result = SeverityService.calculatePriority(
      9, // raw AI rating
      'Water Supply',
      12, // 12 upvotes
      new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days unresolved
    );

    expect(result.priorityScore).toBeGreaterThanOrEqual(70);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.factors.safetyRisk).toBe(100);
    expect(result.factors.populationImpact).toBe(60); // 12 * 5
    expect(result.factors.durationImpact).toBe(20); // 10 * 2
    expect(result.band).toMatch(/High|Critical/);
  });

  it('should NEVER penalize older complaints (prolonged duration increases priority)', () => {
    const complaintNew = SeverityService.calculatePriority(
      5,
      'Roads',
      2,
      new Date() // Today
    );

    const complaintOld = SeverityService.calculatePriority(
      5,
      'Roads',
      2,
      new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) // 25 days unresolved
    );

    // Older complaint with same parameters MUST have equal or higher priority score
    expect(complaintOld.priorityScore).toBeGreaterThanOrEqual(complaintNew.priorityScore);
  });

  it('should clamp scores strictly within [1, 100]', () => {
    const minResult = SeverityService.calculatePriority(1, 'Parks', 0, new Date());
    const maxResult = SeverityService.calculatePriority(10, 'Electricity', 50, new Date(Date.now() - 100 * 24 * 60 * 60 * 1000));

    expect(minResult.priorityScore).toBeGreaterThanOrEqual(1);
    expect(maxResult.priorityScore).toBeLessThanOrEqual(100);
  });

  it('should include transparent prototype disclaimer', () => {
    const result = SeverityService.calculatePriority(6, 'Roads');
    expect(result.disclaimer).toContain('Prototype estimate');
  });
});
