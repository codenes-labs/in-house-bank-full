import { addCalendarMonths, formatCalendarDate, parseCalendarDate } from '../domain/calendar/calendar-date-parts';
import { InstallmentPlanType } from '../domain/enums/installment-plan-type';
import type { Installment } from '../domain/models/installment';
import type { InstallmentPlan } from '../domain/models/installment-plan';
import type { CalendarDate } from '../domain/models/calendar-date';

/** Catálogo fixo dos 15 parcelamentos da conta demo (só código; não replica no Neon). */
const DEMO_PIX = '11999999999';
const DEMO_BENEFICIARY = 'Demo In House Bank';
const DEMO_INSTITUTION = 'Caixinha Demo';

type DemoPlanSeed = {
  borrowerName: string;
  reference: string;
  type: InstallmentPlanType;
  installmentsCount: number;
  usedAmountCents: number;
  returnAmountCents: number;
  firstDueDate: CalendarDate;
  paidInstallments: number;
};

const DEMO_PLAN_SEEDS: DemoPlanSeed[] = [
  {
    borrowerName: 'Cliente Fictício',
    reference: 'DEMO-001',
    type: InstallmentPlanType.Loan,
    installmentsCount: 2,
    usedAmountCents: 54_000,
    returnAmountCents: 60_480,
    firstDueDate: '2026-02-10',
    paidInstallments: 1,
  },
  {
    borrowerName: 'Wesley Nunes Lima',
    reference: 'Cadeira Amazon',
    type: InstallmentPlanType.Purchase,
    installmentsCount: 4,
    usedAmountCents: 45_000,
    returnAmountCents: 59_900,
    firstDueDate: '2026-03-10',
    paidInstallments: 0,
  },
  {
    borrowerName: 'Maria Silva',
    reference: 'Notebook trabalho',
    type: InstallmentPlanType.Purchase,
    installmentsCount: 4,
    usedAmountCents: 320_000,
    returnAmountCents: 360_000,
    firstDueDate: '2026-01-10',
    paidInstallments: 4,
  },
  {
    borrowerName: 'João Santos',
    reference: 'Reforma banheiro',
    type: InstallmentPlanType.Other,
    installmentsCount: 6,
    usedAmountCents: 180_000,
    returnAmountCents: 210_000,
    firstDueDate: '2025-11-10',
    paidInstallments: 3,
  },
  {
    borrowerName: 'Ana Costa',
    reference: 'iPhone 15',
    type: InstallmentPlanType.Purchase,
    installmentsCount: 10,
    usedAmountCents: 550_000,
    returnAmountCents: 650_000,
    firstDueDate: '2026-04-10',
    paidInstallments: 0,
  },
  {
    borrowerName: 'Pedro Oliveira',
    reference: 'Empréstimo pessoal',
    type: InstallmentPlanType.Loan,
    installmentsCount: 3,
    usedAmountCents: 25_000,
    returnAmountCents: 28_500,
    firstDueDate: '2025-12-10',
    paidInstallments: 0,
  },
  {
    borrowerName: 'Carla Mendes',
    reference: 'Geladeira',
    type: InstallmentPlanType.Purchase,
    installmentsCount: 5,
    usedAmountCents: 210_000,
    returnAmountCents: 245_000,
    firstDueDate: '2026-02-10',
    paidInstallments: 2,
  },
  {
    borrowerName: 'Ricardo Alves',
    reference: 'Moto CG 160',
    type: InstallmentPlanType.Loan,
    installmentsCount: 12,
    usedAmountCents: 980_000,
    returnAmountCents: 1_150_000,
    firstDueDate: '2025-10-10',
    paidInstallments: 5,
  },
  {
    borrowerName: 'Fernanda Lima',
    reference: 'Curso inglês',
    type: InstallmentPlanType.Other,
    installmentsCount: 2,
    usedAmountCents: 36_000,
    returnAmountCents: 40_000,
    firstDueDate: '2026-05-10',
    paidInstallments: 0,
  },
  {
    borrowerName: 'Bruno Henrique',
    reference: 'Sofá 3 lugares',
    type: InstallmentPlanType.Purchase,
    installmentsCount: 4,
    usedAmountCents: 140_000,
    returnAmountCents: 168_000,
    firstDueDate: '2026-01-10',
    paidInstallments: 1,
  },
  {
    borrowerName: 'Juliana Rocha',
    reference: 'Viagem Nordeste',
    type: InstallmentPlanType.Withdrawal,
    installmentsCount: 3,
    usedAmountCents: 72_000,
    returnAmountCents: 84_000,
    firstDueDate: '2026-06-10',
    paidInstallments: 0,
  },
  {
    borrowerName: 'Marcos Paulo',
    reference: 'Ferramentas',
    type: InstallmentPlanType.Purchase,
    installmentsCount: 2,
    usedAmountCents: 18_000,
    returnAmountCents: 20_000,
    firstDueDate: '2025-09-10',
    paidInstallments: 2,
  },
  {
    borrowerName: 'Patricia Souza',
    reference: 'Notebook filha',
    type: InstallmentPlanType.Loan,
    installmentsCount: 8,
    usedAmountCents: 280_000,
    returnAmountCents: 320_000,
    firstDueDate: '2026-03-10',
    paidInstallments: 3,
  },
  {
    borrowerName: 'Lucas Ferreira',
    reference: 'Ar condicionado',
    type: InstallmentPlanType.Purchase,
    installmentsCount: 6,
    usedAmountCents: 195_000,
    returnAmountCents: 228_000,
    firstDueDate: '2026-02-10',
    paidInstallments: 1,
  },
  {
    borrowerName: 'Beatriz Azevedo',
    reference: 'Consultoria',
    type: InstallmentPlanType.Other,
    installmentsCount: 1,
    usedAmountCents: 42_000,
    returnAmountCents: 45_000,
    firstDueDate: '2026-07-10',
    paidInstallments: 0,
  },
];

export const DEMO_PLAN_COUNT = DEMO_PLAN_SEEDS.length;

export const DEMO_PLAN_ID = demoPlanId(1);

function demoPlanId(index: number): string {
  return `a1000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

function demoInstallmentId(planIndex: number, installmentNumber: number): string {
  return `a2000000-0000-4000-8000-${String(planIndex * 100 + installmentNumber).padStart(12, '0')}`;
}

function dueDateOnDayTen(firstDueDate: CalendarDate, monthOffset: number): CalendarDate {
  const shifted = addCalendarMonths(parseCalendarDate(firstDueDate), monthOffset);
  return formatCalendarDate({ ...shifted, day: 10 });
}

function splitCents(totalCents: number, count: number): number[] {
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  return Array.from({ length: count }, (_, index) => base + (index === count - 1 ? remainder : 0));
}

function issueDateFromFirstDue(firstDueDate: CalendarDate): CalendarDate {
  const parts = parseCalendarDate(firstDueDate);
  const shifted = addCalendarMonths(parts, -1);
  return formatCalendarDate({ ...shifted, day: 15 });
}

export function buildDemoInstallmentPlansAndInstallments(): {
  installmentPlans: InstallmentPlan[];
  installments: Installment[];
} {
  const installmentPlans: InstallmentPlan[] = [];
  const installments: Installment[] = [];

  DEMO_PLAN_SEEDS.forEach((seed, index) => {
    const planIndex = index + 1;
    const id = demoPlanId(planIndex);
    const issueDate = issueDateFromFirstDue(seed.firstDueDate);
    installmentPlans.push({
      id,
      type: seed.type,
      reference: seed.reference,
      borrowerName: seed.borrowerName,
      usedAmountCents: seed.usedAmountCents,
      returnAmountCents: seed.returnAmountCents,
      issueDate,
      firstDueDate: seed.firstDueDate,
      installmentsCount: seed.installmentsCount,
      pixKey: DEMO_PIX,
      beneficiary: DEMO_BENEFICIARY,
      institution: DEMO_INSTITUTION,
      payerPhone: DEMO_PIX,
      createdAt: `${issueDate}T12:00:00.000Z`,
    });

    const amounts = splitCents(seed.returnAmountCents, seed.installmentsCount);
    amounts.forEach((amountCents, installmentIndex) => {
      const number = installmentIndex + 1;
      const dueDate = dueDateOnDayTen(seed.firstDueDate, installmentIndex);
      const paid = number <= seed.paidInstallments;
      installments.push({
        id: demoInstallmentId(planIndex, number),
        planId: id,
        number,
        dueDate,
        amountCents,
        paidDate: paid ? dueDate : undefined,
        txid: `DEMO${String(planIndex).padStart(2, '0')}${String(number).padStart(2, '0')}`,
      });
    });
  });

  return { installmentPlans, installments };
}
