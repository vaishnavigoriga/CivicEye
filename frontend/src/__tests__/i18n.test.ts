import { describe, it, expect } from 'vitest';
import { getTranslation } from '../utils/i18n';

describe('i18n Translations Dictionary', () => {
  it('should return English translation by default', () => {
    const t = getTranslation('en');
    expect(t.appName).toBe('CivicEye');
    expect(t.city).toBe('Hyderabad, India');
    expect(t.categories.Roads).toBe('Roads & Potholes');
  });

  it('should return Telugu translation', () => {
    const t = getTranslation('te');
    expect(t.appName).toContain('సివిక్ ఐ');
    expect(t.categories.Roads).toContain('రోడ్లు');
  });

  it('should return Hindi translation', () => {
    const t = getTranslation('hi');
    expect(t.appName).toContain('सिविक आई');
    expect(t.categories.Roads).toContain('सड़कें');
  });
});
