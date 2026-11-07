import { describe, expect, it } from 'vitest';
import { createEmptySettings } from '../models/settings';
import { settingsAfterDeletingCashBox } from './settings-after-deleting-cash-box';

describe('settingsAfterDeletingCashBox', () => {
  it('adds the cash box balance to free balance', () => {
    const settings = { ...createEmptySettings(), freeBalanceCents: 2_500_00 };
    const next = settingsAfterDeletingCashBox(settings, {
      id: 'box',
      name: 'Poupança',
      institution: 'Banco',
      cdiPercent: 100,
      balanceCents: 3_200_00,
    });
    expect(next.freeBalanceCents).toBe(5_700_00);
  });

  it('leaves settings unchanged when the box is missing or has zero balance', () => {
    const settings = { ...createEmptySettings(), freeBalanceCents: 1_000_00 };
    expect(settingsAfterDeletingCashBox(settings, undefined)).toBe(settings);
    expect(
      settingsAfterDeletingCashBox(settings, {
        id: 'box',
        name: 'Vazia',
        institution: 'Banco',
        cdiPercent: 100,
        balanceCents: 0,
      }),
    ).toBe(settings);
  });
});
