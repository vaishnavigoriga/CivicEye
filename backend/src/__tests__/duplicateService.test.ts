import { DuplicateService } from '../services/duplicateService';

describe('DuplicateService (Jaccard Text & Word Similarity)', () => {
  it('should return 1.0 for identical sentences', () => {
    const text1 = 'Massive pothole near cyber towers traffic light';
    const text2 = 'Massive pothole near cyber towers traffic light';
    const score = DuplicateService.calculateJaccardSimilarity(text1, text2);
    expect(score).toBe(1.0);
  });

  it('should detect high similarity for paraphrased complaints', () => {
    const text1 = 'Water pipeline burst and flooding cyber towers road';
    const text2 = 'Water pipeline leaking and cyber towers road flooded';
    const score = DuplicateService.calculateJaccardSimilarity(text1, text2);
    expect(score).toBeGreaterThanOrEqual(0.35); // Above threshold
  });

  it('should return near 0 for completely unrelated complaints', () => {
    const text1 = 'Street lights not working near park';
    const text2 = 'Dead stray dog on highway causing traffic jam';
    const score = DuplicateService.calculateJaccardSimilarity(text1, text2);
    expect(score).toBeLessThan(0.15);
  });
});
