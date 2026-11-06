import { compareCalendarDates } from '../calendar/compare-calendar-dates';
import { formatCalendarDate, parseCalendarDate } from '../calendar/calendar-date-parts';
import { availableDepositCents } from '../cash-boxes/suggest-cash-box-for-deposit';
import { computeExpectedProfitCents } from '../installments/compute-expected-profit-cents';
import { deriveInstallmentStatus } from '../installments/derive-installment-status';
import { InstallmentPlanType } from '../enums/installment-plan-type';
import { InstallmentStatus } from '../enums/installment-status';
import { computeEstimatedFullMonthYieldCents } from '../finance/compute-estimated-monthly-yield';
import type { CashBox } from '../models/cash-box';
import type { CashBoxMovement } from '../models/cash-box-movement';
import type { CalendarDate } from '../models/calendar-date';
import type { Installment } from '../models/installment';
import type { InstallmentPlan } from '../models/installment-plan';
import type { Settings } from '../models/settings';
import { CashBoxMovementType } from '../enums/cash-box-movement-type';
import { calendarMonthKey } from './calendar-month-key';
import { differenceInCalendarDays } from './difference-in-calendar-days';

export interface MonthlyCashFlowRow {
  month: string;
  expectedInCents: number;
  realizedInCents: number;
}

export interface DelinquencyByBorrowerRow {
  borrowerName: string;
  days1To15Cents: number;
  days16To30Cents: number;
  days31PlusCents: number;
  days1To15Count: number;
  days16To30Count: number;
  days31PlusCount: number;
}

export interface MonthlyProfitRow {
  month: string;
  expectedProfitCents: number;
  realizedProfitCents: number;
}

export interface BorrowerRankingRow {
  borrowerName: string;
  totalUsedCents: number;
  totalReturnedCents: number;
  expectedProfitCents: number;
  realizedProfitCents: number;
  overdueCount: number;
}

export interface ProfitByTypeRow {
  type: InstallmentPlanType;
  expectedProfitCents: number;
  realizedProfitCents: number;
  planCount: number;
}

export interface ProfitByReferenceRow {
  reference: string;
  type: InstallmentPlanType;
  expectedProfitCents: number;
  realizedProfitCents: number;
}

export interface ReceivablesBucketRow {
  periodKey: string;
  periodLabel: string;
  installmentCount: number;
  amountCents: number;
}

export interface EffectiveRateRow {
  planId: string;
  borrowerName: string;
  reference: string;
  usedAmountCents: number;
  returnAmountCents: number;
  returnToPrincipalRatio: number;
  equivalentMonthlyPercent: number;
}

export interface PatrimonyPoint {
  month: string;
  patrimonyCents: number;
  milestoneCents: number | null;
}

export interface CashBoxYieldRow {
  cashBoxId: string;
  name: string;
  balanceCents: number;
  limitCents: number | null;
  limitUsagePercent: number | null;
  availableLimitCents: number | null;
  estimatedMonthlyYieldCents: number;
}

export interface CardSavingsRow {
  planId: string;
  borrowerName: string;
  reference: string;
  cardPriceCents: number;
  returnAmountCents: number;
  savingsCents: number;
}

export interface CardSavingsReport {
  totalSavingsCents: number;
  rows: CardSavingsRow[];
}

export interface ReportsData {
  monthlyCashFlow: MonthlyCashFlowRow[];
  delinquencyByBorrower: DelinquencyByBorrowerRow[];
  monthlyProfit: MonthlyProfitRow[];
  borrowerRanking: BorrowerRankingRow[];
  profitByType: ProfitByTypeRow[];
  profitByReference: ProfitByReferenceRow[];
  receivablesByWeek: ReceivablesBucketRow[];
  receivablesByMonth: ReceivablesBucketRow[];
  effectiveRates: EffectiveRateRow[];
  patrimonyEvolution: PatrimonyPoint[];
  cashBoxYields: CashBoxYieldRow[];
  cardSavings: CardSavingsReport;
}

export function computeReports(input: {
  plans: InstallmentPlan[];
  installments: Installment[];
  settings: Settings;
  cashBoxes: CashBox[];
  cashBoxMovements: CashBoxMovement[];
  today: CalendarDate;
}): ReportsData {
  const plansById = new Map(input.plans.map((plan) => [plan.id, plan]));
  const installmentsByPlanId = groupInstallmentsByPlanId(input.installments);

  return {
    monthlyCashFlow: computeMonthlyCashFlow(input.installments),
    delinquencyByBorrower: computeDelinquencyByBorrower(input.installments, plansById, input.today),
    monthlyProfit: computeMonthlyProfit(input.plans, input.installments),
    borrowerRanking: computeBorrowerRanking(input.plans, installmentsByPlanId, input.today),
    profitByType: computeProfitByType(input.plans, installmentsByPlanId),
    profitByReference: computeProfitByReference(input.plans, installmentsByPlanId),
    receivablesByWeek: computeReceivablesSchedule(input.installments, input.today, 'week'),
    receivablesByMonth: computeReceivablesSchedule(input.installments, input.today, 'month'),
    effectiveRates: computeEffectiveRates(input.plans),
    patrimonyEvolution: computePatrimonyEvolution(
      input.settings,
      input.cashBoxes,
      input.cashBoxMovements,
      input.plans,
      input.today,
    ),
    cashBoxYields: computeCashBoxYields(input.cashBoxes, input.settings),
    cardSavings: computeCardSavings(input.plans),
  };
}

function computeMonthlyCashFlow(installments: Installment[]): MonthlyCashFlowRow[] {
  const expected = new Map<string, number>();
  const realized = new Map<string, number>();

  for (const installment of installments) {
    const dueMonth = calendarMonthKey(installment.dueDate);
    expected.set(dueMonth, (expected.get(dueMonth) ?? 0) + installment.amountCents);

    if (installment.paidDate) {
      const paidMonth = calendarMonthKey(installment.paidDate);
      realized.set(paidMonth, (realized.get(paidMonth) ?? 0) + installment.amountCents);
    }
  }

  return mergeMonthMaps(expected, realized);
}

function computeMonthlyProfit(
  plans: InstallmentPlan[],
  installments: Installment[],
): MonthlyProfitRow[] {
  const expected = new Map<string, number>();
  for (const plan of plans) {
    const month = calendarMonthKey(plan.issueDate);
    expected.set(month, (expected.get(month) ?? 0) + computeExpectedProfitCents(plan));
  }

  const realized = new Map<string, number>();
  const sortedPaid = [...installments]
    .filter((installment) => installment.paidDate)
    .sort((left, right) => comparePaidInstallments(left, right));

  const receivedByPlan = new Map<string, number>();
  for (const installment of sortedPaid) {
    const plan = plans.find((item) => item.id === installment.planId);
    if (!plan || !installment.paidDate) {
      continue;
    }
    const before = receivedByPlan.get(plan.id) ?? 0;
    const after = before + installment.amountCents;
    receivedByPlan.set(plan.id, after);
    const increment =
      Math.max(0, after - plan.usedAmountCents) - Math.max(0, before - plan.usedAmountCents);
    if (increment > 0) {
      const month = calendarMonthKey(installment.paidDate);
      realized.set(month, (realized.get(month) ?? 0) + increment);
    }
  }

  return mergeMonthMaps(expected, realized).map((row) => ({
    month: row.month,
    expectedProfitCents: row.expectedInCents,
    realizedProfitCents: row.realizedInCents,
  }));
}

function comparePaidInstallments(left: Installment, right: Installment): number {
  const dateCompare = compareCalendarDates(left.paidDate ?? '', right.paidDate ?? '');
  if (dateCompare !== 0) {
    return dateCompare;
  }
  return left.number - right.number;
}

function computeDelinquencyByBorrower(
  installments: Installment[],
  plansById: Map<string, InstallmentPlan>,
  today: CalendarDate,
): DelinquencyByBorrowerRow[] {
  const rows = new Map<string, DelinquencyByBorrowerRow>();

  for (const installment of installments) {
    if (deriveInstallmentStatus(installment, today) !== InstallmentStatus.Overdue) {
      continue;
    }
    const plan = plansById.get(installment.planId);
    if (!plan) {
      continue;
    }
    const days = differenceInCalendarDays(installment.dueDate, today);
    const bucket = rows.get(plan.borrowerName) ?? emptyDelinquencyRow(plan.borrowerName);
    if (days <= 15) {
      bucket.days1To15Cents += installment.amountCents;
      bucket.days1To15Count += 1;
    } else if (days <= 30) {
      bucket.days16To30Cents += installment.amountCents;
      bucket.days16To30Count += 1;
    } else {
      bucket.days31PlusCents += installment.amountCents;
      bucket.days31PlusCount += 1;
    }
    rows.set(plan.borrowerName, bucket);
  }

  return [...rows.values()].sort((left, right) =>
    left.borrowerName.localeCompare(right.borrowerName, 'pt-BR'),
  );
}

function emptyDelinquencyRow(borrowerName: string): DelinquencyByBorrowerRow {
  return {
    borrowerName,
    days1To15Cents: 0,
    days16To30Cents: 0,
    days31PlusCents: 0,
    days1To15Count: 0,
    days16To30Count: 0,
    days31PlusCount: 0,
  };
}

function computeBorrowerRanking(
  plans: InstallmentPlan[],
  installmentsByPlanId: Map<string, Installment[]>,
  today: CalendarDate,
): BorrowerRankingRow[] {
  const rows = new Map<string, BorrowerRankingRow>();

  for (const plan of plans) {
    const row = rows.get(plan.borrowerName) ?? {
      borrowerName: plan.borrowerName,
      totalUsedCents: 0,
      totalReturnedCents: 0,
      expectedProfitCents: 0,
      realizedProfitCents: 0,
      overdueCount: 0,
    };
    row.totalUsedCents += plan.usedAmountCents;
    row.expectedProfitCents += computeExpectedProfitCents(plan);

    const planInstallments = installmentsByPlanId.get(plan.id) ?? [];
    const returned = planInstallments
      .filter((item) => item.paidDate)
      .reduce((sum, item) => sum + item.amountCents, 0);
    row.totalReturnedCents += returned;
    row.realizedProfitCents += Math.max(0, returned - plan.usedAmountCents);
    row.overdueCount += planInstallments.filter(
      (item) => deriveInstallmentStatus(item, today) === InstallmentStatus.Overdue,
    ).length;

    rows.set(plan.borrowerName, row);
  }

  return [...rows.values()].sort((left, right) => right.totalUsedCents - left.totalUsedCents);
}

function computeProfitByType(
  plans: InstallmentPlan[],
  installmentsByPlanId: Map<string, Installment[]>,
): ProfitByTypeRow[] {
  const rows = new Map<InstallmentPlanType, ProfitByTypeRow>();
  for (const type of Object.values(InstallmentPlanType)) {
    rows.set(type, { type, expectedProfitCents: 0, realizedProfitCents: 0, planCount: 0 });
  }

  for (const plan of plans) {
    const row = rows.get(plan.type)!;
    row.planCount += 1;
    row.expectedProfitCents += computeExpectedProfitCents(plan);
    const returned = sumPaidAmount(installmentsByPlanId.get(plan.id) ?? []);
    row.realizedProfitCents += Math.max(0, returned - plan.usedAmountCents);
  }

  return [...rows.values()].filter((row) => row.planCount > 0);
}

function computeProfitByReference(
  plans: InstallmentPlan[],
  installmentsByPlanId: Map<string, Installment[]>,
): ProfitByReferenceRow[] {
  return plans
    .map((plan) => {
      const returned = sumPaidAmount(installmentsByPlanId.get(plan.id) ?? []);
      return {
        reference: plan.reference,
        type: plan.type,
        expectedProfitCents: computeExpectedProfitCents(plan),
        realizedProfitCents: Math.max(0, returned - plan.usedAmountCents),
      };
    })
    .sort((left, right) => left.reference.localeCompare(right.reference, 'pt-BR'));
}

function computeReceivablesSchedule(
  installments: Installment[],
  today: CalendarDate,
  mode: 'week' | 'month',
): ReceivablesBucketRow[] {
  const buckets = new Map<string, ReceivablesBucketRow>();

  for (const installment of installments) {
    if (deriveInstallmentStatus(installment, today) !== InstallmentStatus.Pending) {
      continue;
    }
    if (compareCalendarDates(installment.dueDate, today) <= 0) {
      continue;
    }

    const periodKey =
      mode === 'month'
        ? calendarMonthKey(installment.dueDate)
        : weekStartMondayKey(installment.dueDate);
    const periodLabel = mode === 'month' ? formatMonthLabel(periodKey) : formatWeekLabel(periodKey);

    const bucket = buckets.get(periodKey) ?? {
      periodKey,
      periodLabel,
      installmentCount: 0,
      amountCents: 0,
    };
    bucket.installmentCount += 1;
    bucket.amountCents += installment.amountCents;
    buckets.set(periodKey, bucket);
  }

  return [...buckets.values()].sort((left, right) => left.periodKey.localeCompare(right.periodKey));
}

function computeEffectiveRates(plans: InstallmentPlan[]): EffectiveRateRow[] {
  return plans.map((plan) => {
    const ratio = plan.usedAmountCents > 0 ? plan.returnAmountCents / plan.usedAmountCents : 0;
    const equivalentMonthlyPercent =
      plan.installmentsCount > 0 && plan.usedAmountCents > 0
        ? ((ratio - 1) / plan.installmentsCount) * 100
        : 0;
    return {
      planId: plan.id,
      borrowerName: plan.borrowerName,
      reference: plan.reference,
      usedAmountCents: plan.usedAmountCents,
      returnAmountCents: plan.returnAmountCents,
      returnToPrincipalRatio: ratio,
      equivalentMonthlyPercent,
    };
  });
}

function computePatrimonyEvolution(
  settings: Settings,
  cashBoxes: CashBox[],
  movements: CashBoxMovement[],
  plans: InstallmentPlan[],
  today: CalendarDate,
): PatrimonyPoint[] {
  const months = collectTimelineMonths(plans, movements, today);
  if (months.length === 0) {
    const current = settings.freeBalanceCents + sumCashBoxBalances(cashBoxes);
    return [
      {
        month: calendarMonthKey(today),
        patrimonyCents: current,
        milestoneCents: resolveMilestoneForPatrimony(current, settings.milestonesCents),
      },
    ];
  }

  return months.map((month) => {
    const monthEnd = lastDayOfMonth(month);
    const cashBoxesTotal = cashBoxes.reduce(
      (total, cashBox) => total + cashBoxBalanceAtDate(cashBox, movements, monthEnd),
      0,
    );
    const patrimonyCents = settings.freeBalanceCents + cashBoxesTotal;
    return {
      month,
      patrimonyCents,
      milestoneCents: resolveMilestoneForPatrimony(patrimonyCents, settings.milestonesCents),
    };
  });
}

function computeCashBoxYields(cashBoxes: CashBox[], settings: Settings): CashBoxYieldRow[] {
  return cashBoxes.map((cashBox) => {
    const available = availableDepositCents(cashBox);
    const limitUsagePercent =
      cashBox.limitCents !== undefined && cashBox.limitCents > 0
        ? Math.round((cashBox.balanceCents / cashBox.limitCents) * 100)
        : null;
    return {
      cashBoxId: cashBox.id,
      name: cashBox.name,
      balanceCents: cashBox.balanceCents,
      limitCents: cashBox.limitCents ?? null,
      limitUsagePercent: limitUsagePercent !== null ? Math.min(100, limitUsagePercent) : null,
      availableLimitCents: available === Number.MAX_SAFE_INTEGER ? null : available,
      estimatedMonthlyYieldCents: computeEstimatedFullMonthYieldCents(
        cashBox.balanceCents,
        settings.cdiAnnualPercent,
        cashBox.cdiPercent,
      ),
    };
  });
}

function computeCardSavings(plans: InstallmentPlan[]): CardSavingsReport {
  const rows = plans
    .filter((plan) => plan.cardPriceCents !== undefined && plan.cardPriceCents > 0)
    .map((plan) => {
      const cardPriceCents = plan.cardPriceCents!;
      const savingsCents = Math.max(0, cardPriceCents - plan.returnAmountCents);
      return {
        planId: plan.id,
        borrowerName: plan.borrowerName,
        reference: plan.reference,
        cardPriceCents,
        returnAmountCents: plan.returnAmountCents,
        savingsCents,
      };
    })
    .filter((row) => row.savingsCents > 0);

  return {
    totalSavingsCents: rows.reduce((total, row) => total + row.savingsCents, 0),
    rows,
  };
}

function mergeMonthMaps(
  expected: Map<string, number>,
  realized: Map<string, number>,
): MonthlyCashFlowRow[] {
  const months = new Set([...expected.keys(), ...realized.keys()]);
  return [...months].sort().map((month) => ({
    month,
    expectedInCents: expected.get(month) ?? 0,
    realizedInCents: realized.get(month) ?? 0,
  }));
}

function groupInstallmentsByPlanId(installments: Installment[]): Map<string, Installment[]> {
  const map = new Map<string, Installment[]>();
  for (const installment of installments) {
    const bucket = map.get(installment.planId) ?? [];
    bucket.push(installment);
    map.set(installment.planId, bucket);
  }
  return map;
}

function sumPaidAmount(installments: Installment[]): number {
  return installments
    .filter((installment) => installment.paidDate)
    .reduce((total, installment) => total + installment.amountCents, 0);
}

function sumCashBoxBalances(cashBoxes: CashBox[]): number {
  return cashBoxes.reduce((total, cashBox) => total + cashBox.balanceCents, 0);
}

function weekStartMondayKey(date: CalendarDate): string {
  const parts = parseCalendarDate(date);
  const weekday = new Date(parts.year, parts.month - 1, parts.day).getDay();
  const daysFromMonday = (weekday + 6) % 7;
  const monday = new Date(parts.year, parts.month - 1, parts.day);
  monday.setDate(monday.getDate() - daysFromMonday);
  return formatCalendarDate({
    year: monday.getFullYear(),
    month: monday.getMonth() + 1,
    day: monday.getDate(),
  });
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `${month}/${year}`;
}

function formatWeekLabel(weekStart: CalendarDate): string {
  const parts = parseCalendarDate(weekStart);
  const day = String(parts.day).padStart(2, '0');
  const month = String(parts.month).padStart(2, '0');
  return `Semana de ${day}/${month}/${parts.year}`;
}

function collectTimelineMonths(
  plans: InstallmentPlan[],
  movements: CashBoxMovement[],
  today: CalendarDate,
): string[] {
  const candidates: CalendarDate[] = [today];
  for (const plan of plans) {
    candidates.push(plan.issueDate);
  }
  for (const movement of movements) {
    candidates.push(movement.date);
  }
  const start = candidates.reduce((min, date) =>
    compareCalendarDates(date, min) < 0 ? date : min,
  );
  return enumerateMonths(calendarMonthKey(start), calendarMonthKey(today));
}

function enumerateMonths(startMonth: string, endMonth: string): string[] {
  const months: string[] = [];
  let current = startMonth;
  while (current <= endMonth) {
    months.push(current);
    current = addOneMonth(current);
  }
  return months;
}

function addOneMonth(monthKey: string): string {
  const [yearText, monthText] = monthKey.split('-');
  let year = Number(yearText);
  let month = Number(monthText) + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

function lastDayOfMonth(monthKey: string): CalendarDate {
  const [yearText, monthText] = monthKey.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = new Date(year, month, 0).getDate();
  return formatCalendarDate({ year, month, day });
}

function cashBoxBalanceAtDate(
  cashBox: CashBox,
  movements: CashBoxMovement[],
  atDate: CalendarDate,
): number {
  let balance = cashBox.balanceCents;
  const futureMovements = movements
    .filter((movement) => movement.cashBoxId === cashBox.id)
    .filter((movement) => compareCalendarDates(movement.date, atDate) > 0)
    .sort((left, right) => compareCalendarDates(right.date, left.date));

  for (const movement of futureMovements) {
    if (movement.type === CashBoxMovementType.Deposit) {
      balance -= movement.amountCents;
    } else {
      balance += movement.amountCents;
    }
  }
  return balance;
}

function resolveMilestoneForPatrimony(
  patrimonyCents: number,
  milestonesCents: number[],
): number | null {
  const sorted = [...milestonesCents].filter((value) => value > 0).sort((a, b) => a - b);
  return sorted.find((milestone) => milestone > patrimonyCents) ?? sorted.at(-1) ?? null;
}
