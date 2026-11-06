import { describe, expect, it } from 'vitest';
import { buildInstallmentDrafts } from './build-installment-drafts';

describe('buildInstallmentDrafts', () => {
  it('combines RN-02 and RN-03 for the carnê acceptance case', () => {
    const drafts = buildInstallmentDrafts(59_900, 4, '2026-11-09');

    expect(drafts).toEqual([
      { number: 1, dueDate: '2026-11-09', amountCents: 14_975 },
      { number: 2, dueDate: '2026-12-09', amountCents: 14_975 },
      { number: 3, dueDate: '2027-01-09', amountCents: 14_975 },
      { number: 4, dueDate: '2027-02-09', amountCents: 14_975 },
    ]);
  });
});
