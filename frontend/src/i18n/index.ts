import { en, type Dictionary } from './en';
import { te } from './te';
import { hi } from './hi';

export type Language = 'en' | 'te' | 'hi';

export const LANGUAGES: { code: Language; label: string; htmlLang: string }[] = [
  { code: 'en', label: 'English', htmlLang: 'en' },
  { code: 'te', label: 'తెలుగు', htmlLang: 'te' },
  { code: 'hi', label: 'हिन्दी', htmlLang: 'hi' },
];

export const dictionaries: Record<Language, Dictionary> = { en, te, hi };

/** Replace {placeholders} in a translated string. */
export const fmt = (template: string, vars: Record<string, string | number> = {}): string =>
  template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));

/** Normalise backend status values (pending, in-progress) to dictionary keys. */
export const statusKey = (status: string): keyof Dictionary['status'] => {
  const s = status.replace(/-/g, '_');
  if (s === 'pending') return 'submitted';
  return (s in en.status ? s : 'submitted') as keyof Dictionary['status'];
};

export type { Dictionary };
