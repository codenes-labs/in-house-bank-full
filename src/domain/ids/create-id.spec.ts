import { describe, expect, it } from 'vitest';
import { createId, uuidFromRandomBytes } from './create-id';

describe('createId', () => {
  it('builds a version 4 UUID from random bytes', () => {
    const id = uuidFromRandomBytes(Uint8Array.from({ length: 16 }, (_, index) => index));
    expect(id).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f');
  });

  it('returns a UUID', () => {
    expect(createId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
