import { describe, expect, it } from 'vitest';
import { CashBoxMovementType } from '../enums/cash-box-movement-type';
import { groupCashBoxMovementsByMonth } from './group-cash-box-movements-by-month';

describe('groupCashBoxMovementsByMonth', () => {
  it('groups by month, newest first, and sums only deposits in the header total', () => {
    const groups = groupCashBoxMovementsByMonth([
      {
        id: '1',
        cashBoxId: 'box',
        type: CashBoxMovementType.Deposit,
        amountCents: 100_00,
        date: '2026-11-07',
      },
      {
        id: '2',
        cashBoxId: 'box',
        type: CashBoxMovementType.Withdrawal,
        amountCents: 40_00,
        date: '2026-11-05',
      },
      {
        id: '3',
        cashBoxId: 'box',
        type: CashBoxMovementType.Deposit,
        amountCents: 50_00,
        date: '2026-10-01',
      },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.yearMonth).toBe('2026-11');
    expect(groups[0]?.depositsTotalCents).toBe(100_00);
    expect(groups[0]?.movements).toHaveLength(2);
    expect(groups[1]?.depositsTotalCents).toBe(50_00);
  });

  it('lists same-day movements newest first by recordedAt', () => {
    const groups = groupCashBoxMovementsByMonth([
      {
        id: 'older',
        cashBoxId: 'box',
        type: CashBoxMovementType.Deposit,
        amountCents: 312_31,
        date: '2026-03-20',
        recordedAt: '2026-03-20T10:00:00.000Z',
      },
      {
        id: 'newest',
        cashBoxId: 'box',
        type: CashBoxMovementType.Deposit,
        amountCents: 313_13,
        date: '2026-03-20',
        recordedAt: '2026-03-20T10:05:00.000Z',
      },
      {
        id: 'middle',
        cashBoxId: 'box',
        type: CashBoxMovementType.Withdrawal,
        amountCents: 50_00,
        date: '2026-03-20',
        recordedAt: '2026-03-20T10:02:00.000Z',
      },
    ]);
    expect(groups[0]?.movements.map((movement) => movement.id)).toEqual(['newest', 'middle', 'older']);
  });
});
