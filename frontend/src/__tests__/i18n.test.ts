import { describe, it, expect } from 'vitest';
import { dictionaries, fmt, statusKey } from '../i18n';
import { en } from '../i18n/en';

// Collect all key paths of an object so we can compare dictionaries structurally.
const paths = (o: any, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? paths(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

describe('i18n dictionaries', () => {
  it('Telugu and Hindi define exactly the same keys as English', () => {
    const base = paths(en).sort();
    expect(paths(dictionaries.te).sort()).toEqual(base);
    expect(paths(dictionaries.hi).sort()).toEqual(base);
  });

  it('no translation is empty and Telugu/Hindi differ from English for navigation', () => {
    for (const lang of ['te', 'hi'] as const) {
      for (const p of paths(dictionaries[lang])) {
        const v = p.split('.').reduce((a: any, k) => a[k], dictionaries[lang]);
        expect(String(v).trim().length, `${lang}:${p}`).toBeGreaterThan(0);
      }
      expect(dictionaries[lang].nav.report).not.toBe(en.nav.report);
    }
  });

  it('fmt replaces placeholders', () => {
    expect(fmt('Page {page} of {total}', { page: 2, total: 5 })).toBe('Page 2 of 5');
  });

  it('statusKey maps backend values', () => {
    expect(statusKey('pending')).toBe('submitted');
    expect(statusKey('in-progress')).toBe('in_progress');
    expect(statusKey('unknown-value')).toBe('submitted');
  });
});
