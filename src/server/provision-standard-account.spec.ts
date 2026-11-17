import { describe, expect, it } from 'vitest';
import { validateStandardAccountCredentials } from './provision-standard-account';
import { ADMIN_EMAIL, DEMO_EMAIL } from './account-seed';

describe('validateStandardAccountCredentials', () => {
  it('rejects short password and invalid email', () => {
    const result = validateStandardAccountCredentials('invalid', '123');
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.status).toBe(400);
    }
  });

  it('rejects reserved admin and demo emails', () => {
    for (const email of [ADMIN_EMAIL, DEMO_EMAIL]) {
      const result = validateStandardAccountCredentials(email, 'senha123');
      expect('error' in result).toBe(true);
    }
  });

  it('accepts new company email', () => {
    const result = validateStandardAccountCredentials('nova@c1.com', 'senha123');
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.email).toBe('nova@c1.com');
    }
  });
});