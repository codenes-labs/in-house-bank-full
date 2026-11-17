import { describe, expect, it } from 'vitest';
import { generateProvisionalPassword } from './generate-provisional-password';

describe('generateProvisionalPassword', () => {
  it('generates password with minimum length', () => {
    const password = generateProvisionalPassword();
    expect(password.length).toBeGreaterThanOrEqual(12);
  });
});