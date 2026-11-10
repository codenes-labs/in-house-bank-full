import { describe, expect, it } from 'vitest';
import { rejectsDemoPersistence } from './demo-persistence';

describe('rejectsDemoPersistence', () => {
  it('allows demo GET /api/bank', () => {
    expect(rejectsDemoPersistence(true, 'GET', '/api/bank')).toBe(false);
  });

  it('blocks demo PUT on bank routes', () => {
    expect(rejectsDemoPersistence(true, 'PUT', '/api/bank/cash-boxes')).toBe(true);
    expect(rejectsDemoPersistence(true, 'DELETE', '/api/bank/plans/x')).toBe(true);
    expect(rejectsDemoPersistence(true, 'POST', '/api/bank/import')).toBe(true);
  });

  it('allows standard user mutations', () => {
    expect(rejectsDemoPersistence(false, 'PUT', '/api/bank/cash-boxes')).toBe(false);
  });

  it('does not block auth routes for demo', () => {
    expect(rejectsDemoPersistence(true, 'POST', '/api/auth/sign-out')).toBe(false);
  });
});
