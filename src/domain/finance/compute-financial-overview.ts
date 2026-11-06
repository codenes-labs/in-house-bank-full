import { computeDashboardMetrics } from '../dashboard/compute-dashboard-metrics';
import type { CashBox } from '../models/cash-box';
import type { CalendarDate } from '../models/calendar-date';
import type { Installment } from '../models/installment';
import type { InstallmentPlan } from '../models/installment-plan';
import type { Settings } from '../models/settings';
import { computeEstimatedFullMonthYieldCents } from './compute-estimated-monthly-yield';
import { resolveMilestoneStatus, type MilestoneStatus } from './resolve-milestone-status';

export interface CashBoxYieldEstimate {
  cashBoxId: string;
  yieldCents: number;
}

export interface FinancialOverview {
  totalUsedCents: number;
  totalReceivedCents: number;
  cashFlowResultCents: number;
  expectedProfitCents: number;
  realizedProfitCents: number;
  patrimonyCents: number;
  totalCashBoxesCents: number;
  estimatedMonthlyYieldTotalCents: number;
  yieldByCashBox: CashBoxYieldEstimate[];
  milestone: MilestoneStatus;
}

export function computeFinancialOverview(input: {
  plans: InstallmentPlan[];
  installments: Installment[];
  settings: Settings;
  cashBoxes: CashBox[];
  today: CalendarDate;
}): FinancialOverview {
  const metrics = computeDashboardMetrics(input);
  const totalCashBoxesCents = input.cashBoxes.reduce(
    (total, cashBox) => total + cashBox.balanceCents,
    0,
  );

  const yieldByCashBox = input.cashBoxes.map((cashBox) => ({
    cashBoxId: cashBox.id,
    yieldCents: computeEstimatedFullMonthYieldCents(
      cashBox.balanceCents,
      input.settings.cdiAnnualPercent,
      cashBox.cdiPercent,
    ),
  }));

  const estimatedMonthlyYieldTotalCents = yieldByCashBox.reduce(
    (total, item) => total + item.yieldCents,
    0,
  );

  return {
    totalUsedCents: metrics.totalUsedCents,
    totalReceivedCents: metrics.totalReceivedCents,
    cashFlowResultCents: metrics.totalReceivedCents - metrics.totalUsedCents,
    expectedProfitCents: metrics.expectedProfitCents,
    realizedProfitCents: metrics.realizedProfitCents,
    patrimonyCents: metrics.patrimonyCents,
    totalCashBoxesCents,
    estimatedMonthlyYieldTotalCents,
    yieldByCashBox,
    milestone: resolveMilestoneStatus(metrics.patrimonyCents, input.settings.milestonesCents),
  };
}
