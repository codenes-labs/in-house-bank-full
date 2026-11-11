import { describe, expect, it } from 'vitest';
import { readClientIp } from './read-client-ip';

describe('readClientIp', () => {
  it('prefers cf-connecting-ip', () => {
    const request = new Request('https://example.com', {
      headers: { 'cf-connecting-ip': '1.2.3.4', 'x-forwarded-for': '9.9.9.9' },
    });
    expect(readClientIp(request)).toBe('1.2.3.4');
  });

  it('falls back to the first x-forwarded-for hop', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '5.6.7.8, 1.1.1.1' },
    });
    expect(readClientIp(request)).toBe('5.6.7.8');
  });

  it('returns unknown when no proxy headers exist', () => {
    expect(readClientIp(new Request('https://example.com'))).toBe('unknown');
  });
});
