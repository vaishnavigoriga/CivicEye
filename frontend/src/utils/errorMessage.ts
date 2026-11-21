import type { Dictionary } from '../i18n';

/**
 * Localised message for a failed request. Known API error codes are translated; an unknown code falls
 * back to a generic translated message (server text is never shown raw, so the UI stays in one language).
 */
export const errorMessage = (e: any, t: Dictionary): string => {
  if (e?.code === 'NETWORK') return t.common.networkError;
  const known = t.errors as Record<string, string>;
  if (e?.code && known[e.code]) return known[e.code];
  return t.common.errorGeneric;
};

/** Field-level API validation errors (code VALIDATION_ERROR), keyed by field name. */
export const fieldErrors = (e: any): Record<string, string> => (e?.code === 'VALIDATION_ERROR' && e.fields ? e.fields : {});
