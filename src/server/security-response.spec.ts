import { describe, expect, it } from 'vitest';
import { jsonResponse, withSecurityHeaders } from './security-response';

describe('security-response', () => {
  it('adds security headers on jsonResponse', () => {
    const response = jsonResponse({ ok: true });
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
  });

  it('adds security headers on existing response', () => {
    const base = new Response('x', { headers: { 'content-type': 'text/plain' } });
    const wrapped = withSecurityHeaders(base);
    expect(wrapped.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
  });
});
