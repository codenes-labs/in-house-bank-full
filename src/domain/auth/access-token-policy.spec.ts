import { describe, expect, it } from 'vitest';
import { ACCESS_TOKEN_TTL_SECONDS, SESSION_IDLE_TIMEOUT_MS } from './access-token-policy';

describe('access token policy', () => {
  it('uses a bounded session lifetime', () => {
    expect(ACCESS_TOKEN_TTL_SECONDS).toBeLessThanOrEqual(60 * 60 * 24);
    expect(ACCESS_TOKEN_TTL_SECONDS).toBeGreaterThanOrEqual(60 * 60);
  });

  it('uses idle timeout shorter than absolute ttl', () => {
    expect(SESSION_IDLE_TIMEOUT_MS).toBe(2 * 60 * 60 * 1000);
    expect(SESSION_IDLE_TIMEOUT_MS).toBeLessThan(ACCESS_TOKEN_TTL_SECONDS * 1000);
  });
});
