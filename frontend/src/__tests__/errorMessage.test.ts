import { describe, it, expect } from 'vitest';
import { dictionaries } from '../i18n';
import { errorMessage, fieldErrors } from '../utils/errorMessage';

describe('errorMessage', () => {
  it('translates known API error codes in every language', () => {
    for (const lang of ['en', 'te', 'hi'] as const) {
      const t = dictionaries[lang];
      expect(errorMessage({ code: 'INVALID_CREDENTIALS' }, t)).toBe(t.errors.INVALID_CREDENTIALS);
      expect(errorMessage({ code: 'RATE_LIMITED' }, t)).toBe(t.errors.RATE_LIMITED);
    }
  });

  it('uses the network message when the server is unreachable', () => {
    expect(errorMessage({ code: 'NETWORK' }, dictionaries.hi)).toBe(dictionaries.hi.common.networkError);
  });

  it('never shows raw server text for unknown codes', () => {
    expect(errorMessage({ code: 'SOMETHING_NEW', message: 'stack trace here' }, dictionaries.en)).toBe(dictionaries.en.common.errorGeneric);
    expect(errorMessage(new Error('boom'), dictionaries.en)).toBe(dictionaries.en.common.errorGeneric);
  });

  it('exposes field errors only for validation errors', () => {
    expect(fieldErrors({ code: 'VALIDATION_ERROR', fields: { email: 'x' } })).toEqual({ email: 'x' });
    expect(fieldErrors({ code: 'NOT_FOUND', fields: { email: 'x' } })).toEqual({});
  });
});
