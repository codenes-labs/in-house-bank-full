import { describe, expect, it } from 'vitest';
import { PlanStatus } from '../enums/plan-status';
import { derivePlanStatus } from './derive-plan-status';

describe('derivePlanStatus', () => {
  const today = '2026-10-16';

  it('returns SETTLED when every installment is paid', () => {
    expect(
      derivePlanStatus(
        [
          { dueDate: '2026-09-01', paidDate: '2026-09-05' },
          { dueDate: '2026-10-01', paidDate: '2026-10-02' },
        ],
        today,
      ),
    ).toBe(PlanStatus.Settled);
  });

  it('returns OVERDUE when any installment is overdue', () => {
    expect(
      derivePlanStatus(
        [{ dueDate: '2026-09-01', paidDate: '2026-09-05' }, { dueDate: '2026-10-01' }],
        today,
      ),
    ).toBe(PlanStatus.Overdue);
  });

  it('returns ON_TRACK when pending installments are not overdue', () => {
    expect(
      derivePlanStatus(
        [{ dueDate: '2026-09-01', paidDate: '2026-09-05' }, { dueDate: '2026-11-01' }],
        today,
      ),
    ).toBe(PlanStatus.OnTrack);
  });
});
