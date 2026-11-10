import {
  demoPresentationCarneTexts,
  demoPresentationInstallmentDefaults,
} from '../domain/demo/demo-presentation-texts';
import { APP_DATA_BACKUP_VERSION, type AppDataBackup } from '../domain/models/app-data-backup';
import { snapshotFromBackup, type BankSnapshot } from '../repositories/bank-repository';
import { buildDemoCashBoxes, DEMO_CASH_BOX_IDS } from './demo-cash-box-data';
import { buildDemoInstallmentPlansAndInstallments } from './demo-installment-data';

/** Snapshot fictício da demo — fonte no código; não depende de linhas gravadas no Neon. */

export { DEMO_PLAN_ID } from './demo-installment-data';

export const DEMO_CASH_BOX_ID = DEMO_CASH_BOX_IDS.reserve;

export function demoBankSnapshot(): BankSnapshot {
  return snapshotFromBackup(createDemoAppBackup());
}

export function createDemoAppBackup(): AppDataBackup {
  const { installmentPlans, installments } = buildDemoInstallmentPlansAndInstallments();
  const finance = buildDemoCashBoxes();

  return {
    version: APP_DATA_BACKUP_VERSION,
    settings: {
      businessName: 'Demo In House Bank',
      document: '00.000.000/0001-91',
      city: 'São Paulo',
      defaultPixKey: '11999999999',
      defaultInstitution: 'Caixinha Demo',
      theme: 'light',
      cdiAnnualPercent: 13.15,
      milestonesCents: [100_000, 500_000, 1_000_000],
      freeBalanceCents: finance.freeBalanceCents,
      ...demoPresentationCarneTexts(),
      ...demoPresentationInstallmentDefaults(),
    },
    installmentPlans,
    installments,
    cashBoxes: finance.cashBoxes,
    cashBoxMovements: finance.cashBoxMovements,
    freeBalanceWithdrawals: finance.freeBalanceWithdrawals,
    freeBalanceDeposits: finance.freeBalanceDeposits,
  };
}
