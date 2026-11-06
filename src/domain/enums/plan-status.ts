/** Derived installment plan status (RN-04). */
export const PlanStatus = {
  OnTrack: 'ON_TRACK',
  Overdue: 'OVERDUE',
  Settled: 'SETTLED',
} as const;

export type PlanStatus = (typeof PlanStatus)[keyof typeof PlanStatus];
