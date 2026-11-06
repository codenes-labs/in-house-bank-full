import { describe, expect, it } from 'vitest';
import { selectInstallmentsForReprint } from './select-installments-for-reprint';

const installments = [
  {
    id: 'a',
    planId: 'p1',
    number: 1,
    dueDate: '2026-11-01',
    amountCents: 100,
    txid: 't1',
  },
  {
    id: 'b',
    planId: 'p1',
    number: 2,
    dueDate: '2026-12-01',
    amountCents: 100,
    txid: 't2',
  },
];

describe('selectInstallmentsForReprint', () => {
  it('returns all installments sorted when mode is all', () => {
    const result = selectInstallmentsForReprint(installments, new Set(), 'all');
    expect(result).toEqual({ ok: true, installments: installments });
  });

  it('returns only selected installments in plan', () => {
    const result = selectInstallmentsForReprint(installments, new Set(['b']), 'selected');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.installments).toHaveLength(1);
      expect(result.installments[0]?.number).toBe(2);
    }
  });

  it('fails when no selected installments match the plan', () => {
    expect(selectInstallmentsForReprint(installments, new Set(), 'selected')).toEqual({
      ok: false,
      error: 'EMPTY_SELECTION',
    });
  });
});
