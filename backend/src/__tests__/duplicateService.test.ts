import { combinedScore, textSimilarity, timeFactor, tokenize } from '../services/duplicateService';
import { haversineMetres, isInHyderabad, nearestArea } from '../utils/geo';

describe('Haversine distance', () => {
  it('is 0 for the same point and about 1112 m per 0.01 degree of latitude', () => {
    expect(haversineMetres(17.385, 78.4867, 17.385, 78.4867)).toBe(0);
    const d = haversineMetres(17.385, 78.4867, 17.395, 78.4867);
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1125);
  });
  it('knows Hyderabad bounds and the nearest locality', () => {
    expect(isInHyderabad(17.4, 78.48)).toBe(true);
    expect(isInHyderabad(28.6, 77.2)).toBe(false);
    expect(nearestArea(17.4486, 78.3806)).toBe('Hitech City');
  });
});

describe('text similarity', () => {
  it('keeps Telugu and Hindi words intact when tokenising', () => {
    expect(tokenize('జూబ్లీ హిల్స్ రోడ్డులో పెద్ద గుంత')).toContain('రోడ్డులో');
    expect(tokenize('नाली का पानी सड़क पर')).toContain('सड़क');
  });
  it('scores near-duplicates high and unrelated text low', () => {
    const a = 'Sewage overflowing from open manhole on the main road';
    const b = 'Sewage is overflowing from the manhole on main road, foul smell';
    expect(textSimilarity(a, b)).toBeGreaterThan(0.4);
    expect(textSimilarity(a, 'Street light not working in my lane since Monday')).toBeLessThan(0.2);
  });
  it('works for Telugu descriptions', () => {
    const a = 'రోడ్డు మీద పెద్ద గుంత ఉంది వాహనాలకు ప్రమాదం';
    const b = 'రోడ్డు మీద పెద్ద గుంత వాహనాలకు ప్రమాదం';
    expect(textSimilarity(a, b)).toBeGreaterThan(0.5);
  });
  it('closer and newer reports score higher', () => {
    const now = new Date();
    expect(combinedScore(0.8, 10, now, now)).toBeGreaterThan(combinedScore(0.8, 190, now, now));
    expect(combinedScore(0.8, 10, now, now)).toBeGreaterThan(combinedScore(0.8, 10, new Date(now.getTime() - 25 * 86400000), now));
    expect(timeFactor(now, now)).toBe(1);
  });
});
