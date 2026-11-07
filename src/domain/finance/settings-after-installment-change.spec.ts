import { describe, expect, it } from 'vitest';
import { createEmptySettings } from '../models/settings';
import type { Installment } from '../models/installment';
import { settingsAfterInstallmentChange } from './settings-after-installment-change';

const base: Installment = {
  id: 'i1',
  planId: 'p1',
  number: 1,
  dueDate: '2026-11-10',
  amountCents: 10_000,
  txid: 'tx',
};

describe('settingsAfterInstallmentChange', () => {
  const settings = { ...createEmptySettings(), freeBalanceCents: 50_000 };

  it('credits free balance when a parcel is marked paid', () => {
    const next = { ...base, paidDate: '2026-11-07' as const };
    expect(settingsAfterInstallmentChange(settings, base, next).freeBalanceCents).toBe(60_000);
  });

  it('debits free balance when payment is undone', () => {
    const paid = { ...base, paidDate: '2026-11-07' as const };
    expect(settingsAfterInstallmentChange(settings, paid, base).freeBalanceCents).toBe(40_000);
  });

  it('adjusts balance when a paid parcel amount changes', () => {
    const paid = { ...base, paidDate: '2026-11-07' as const };
    const updated = { ...paid, amountCents: 12_000 };
    expect(settingsAfterInstallmentChange(settings, paid, updated).freeBalanceCents).toBe(52_000);
  });

  it('does not change balance when only paidDate changes', () => {
    const paid = { ...base, paidDate: '2026-11-07' as const };
    const moved = { ...paid, paidDate: '2026-11-08' as const };
    expect(settingsAfterInstallmentChange(settings, paid, moved).freeBalanceCents).toBe(50_000);
  });

  it('ignores pending parcel edits', () => {
    const bumped = { ...base, amountCents: 15_000 };
    expect(settingsAfterInstallmentChange(settings, base, bumped).freeBalanceCents).toBe(50_000);
  });
});
