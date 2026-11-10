import { CashBoxMovementType } from '../domain/enums/cash-box-movement-type';
import type { CashBox } from '../domain/models/cash-box';
import type { CashBoxMovement } from '../domain/models/cash-box-movement';
import type { FreeBalanceDeposit } from '../domain/models/free-balance-deposit';
import type { FreeBalanceWithdrawal } from '../domain/models/free-balance-withdrawal';

export const DEMO_CASH_BOX_IDS = {
  reserve: 'a3000000-0000-4000-8000-000000000001',
  travel: 'a3000000-0000-4000-8000-000000000002',
  goals: 'a3000000-0000-4000-8000-000000000003',
} as const;

export function buildDemoCashBoxes(): {
  cashBoxes: CashBox[];
  cashBoxMovements: CashBoxMovement[];
  freeBalanceWithdrawals: FreeBalanceWithdrawal[];
  freeBalanceDeposits: FreeBalanceDeposit[];
  freeBalanceCents: number;
} {
  const cashBoxes: CashBox[] = [
    {
      id: DEMO_CASH_BOX_IDS.reserve,
      name: 'Reserva de emergência',
      institution: 'Banco Fictício',
      cdiPercent: 100,
      limitCents: 800_000,
      balanceCents: 185_000,
    },
    {
      id: DEMO_CASH_BOX_IDS.travel,
      name: 'Viagem 2026',
      institution: 'Caixinha Demo',
      cdiPercent: 110,
      limitCents: 300_000,
      balanceCents: 95_000,
    },
    {
      id: DEMO_CASH_BOX_IDS.goals,
      name: 'Metas do ano',
      institution: 'Banco Fictício',
      cdiPercent: 100,
      balanceCents: 40_000,
    },
  ];

  const cashBoxMovements: CashBoxMovement[] = [
    {
      id: 'a4000000-0000-4000-8000-000000000001',
      cashBoxId: DEMO_CASH_BOX_IDS.reserve,
      type: CashBoxMovementType.Deposit,
      amountCents: 100_000,
      date: '2026-01-10',
      note: 'Aporte inicial',
    },
    {
      id: 'a4000000-0000-4000-8000-000000000002',
      cashBoxId: DEMO_CASH_BOX_IDS.reserve,
      type: CashBoxMovementType.Deposit,
      amountCents: 50_000,
      date: '2026-02-05',
      note: 'Reforço mensal',
    },
    {
      id: 'a4000000-0000-4000-8000-000000000003',
      cashBoxId: DEMO_CASH_BOX_IDS.reserve,
      type: CashBoxMovementType.Withdrawal,
      amountCents: 35_000,
      date: '2026-02-20',
      note: 'Despesa imprevista',
    },
    {
      id: 'a4000000-0000-4000-8000-000000000004',
      cashBoxId: DEMO_CASH_BOX_IDS.travel,
      type: CashBoxMovementType.Deposit,
      amountCents: 60_000,
      date: '2026-01-15',
    },
    {
      id: 'a4000000-0000-4000-8000-000000000005',
      cashBoxId: DEMO_CASH_BOX_IDS.travel,
      type: CashBoxMovementType.Deposit,
      amountCents: 35_000,
      date: '2026-03-01',
      note: 'Economia de março',
    },
    {
      id: 'a4000000-0000-4000-8000-000000000006',
      cashBoxId: DEMO_CASH_BOX_IDS.goals,
      type: CashBoxMovementType.Deposit,
      amountCents: 25_000,
      date: '2026-01-20',
    },
    {
      id: 'a4000000-0000-4000-8000-000000000007',
      cashBoxId: DEMO_CASH_BOX_IDS.goals,
      type: CashBoxMovementType.Deposit,
      amountCents: 20_000,
      date: '2026-02-28',
    },
    {
      id: 'a4000000-0000-4000-8000-000000000008',
      cashBoxId: DEMO_CASH_BOX_IDS.goals,
      type: CashBoxMovementType.Withdrawal,
      amountCents: 5_000,
      date: '2026-03-08',
      note: 'Presente',
    },
  ];

  const freeBalanceDeposits: FreeBalanceDeposit[] = [
    {
      id: 'a5000000-0000-4000-8000-000000000001',
      amountCents: 45_000,
      date: '2026-01-08',
      note: 'Entrada manual',
    },
    {
      id: 'a5000000-0000-4000-8000-000000000002',
      amountCents: 15_240,
      date: '2026-03-05',
      note: 'Resgate da caixinha Antiga poupança',
    },
  ];

  const freeBalanceWithdrawals: FreeBalanceWithdrawal[] = [
    {
      id: 'a6000000-0000-4000-8000-000000000001',
      amountCents: 28_000,
      date: '2026-02-12',
      note: 'Uso pessoal',
    },
    {
      id: 'a6000000-0000-4000-8000-000000000002',
      amountCents: 12_500,
      date: '2026-03-15',
    },
  ];

  const freeBalanceCents = 217_760;

  return {
    cashBoxes,
    cashBoxMovements,
    freeBalanceWithdrawals,
    freeBalanceDeposits,
    freeBalanceCents,
  };
}
