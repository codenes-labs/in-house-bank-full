export const ReturnRateMode = {
  TotalPercent: 'TOTAL_PERCENT',
  MonthlySimple: 'MONTHLY_SIMPLE',
  MonthlyCompound: 'MONTHLY_COMPOUND',
} as const;

export type ReturnRateMode = (typeof ReturnRateMode)[keyof typeof ReturnRateMode];
