import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HOLDING_PROVISIONAL_HOURS,
  holdingProvisionalIsActive,
  resolveHoldingProvisionalAccess,
  clampProvisionalHours,
} from './holding-provisional-access';

describe('holding provisional access', () => {
  const now = Date.parse('2026-11-18T12:00:00.000Z');

  it('hides reveal when expired', () => {
    const view = resolveHoldingProvisionalAccess('temp123', '2026-11-17T12:00:00.000Z', now);
    expect(view.active).toBe(false);
    expect(view.reveal).toBeNull();
  });

  it('shows reveal when active', () => {
    const view = resolveHoldingProvisionalAccess('temp123', '2026-11-19T12:00:00.000Z', now);
    expect(view.active).toBe(true);
    expect(view.reveal).toBe('temp123');
  });

  it('defaults provisional hours', () => {
    expect(clampProvisionalHours(undefined)).toBe(DEFAULT_HOLDING_PROVISIONAL_HOURS);
    expect(clampProvisionalHours(9999)).toBe(24 * 14);
  });

  it('checks active flag', () => {
    expect(holdingProvisionalIsActive('2026-11-19T12:00:00.000Z', now)).toBe(true);
    expect(holdingProvisionalIsActive(null, now)).toBe(false);
  });
});