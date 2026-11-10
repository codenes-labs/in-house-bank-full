import type { AppDataBackup } from '../domain/models/app-data-backup';
import type { CashBox } from '../domain/models/cash-box';
import type { CashBoxMovement } from '../domain/models/cash-box-movement';
import type { FreeBalanceDeposit } from '../domain/models/free-balance-deposit';
import type { FreeBalanceWithdrawal } from '../domain/models/free-balance-withdrawal';
import type { Installment } from '../domain/models/installment';
import type { InstallmentPlan } from '../domain/models/installment-plan';
import type { Settings } from '../domain/models/settings';
import { createEmptySettings } from '../domain/models/settings';

export interface BankSnapshot {
  settings: Settings;
  installmentPlans: InstallmentPlan[];
  installments: Installment[];
  cashBoxes: CashBox[];
  cashBoxMovements: CashBoxMovement[];
  freeBalanceWithdrawals: FreeBalanceWithdrawal[];
  freeBalanceDeposits: FreeBalanceDeposit[];
}

export function createEmptySnapshot(): BankSnapshot {
  return {
    settings: createEmptySettings(),
    installmentPlans: [],
    installments: [],
    cashBoxes: [],
    cashBoxMovements: [],
    freeBalanceWithdrawals: [],
    freeBalanceDeposits: [],
  };
}

export function snapshotFromBackup(backup: AppDataBackup): BankSnapshot {
  return {
    settings: backup.settings,
    installmentPlans: backup.installmentPlans,
    installments: backup.installments,
    cashBoxes: backup.cashBoxes,
    cashBoxMovements: backup.cashBoxMovements,
    freeBalanceWithdrawals: backup.freeBalanceWithdrawals,
    freeBalanceDeposits: backup.freeBalanceDeposits ?? [],
  };
}

export interface BankRepository {
  load(): Promise<BankSnapshot>;
  saveSettings(settings: Settings): Promise<void>;
  savePlan(plan: InstallmentPlan): Promise<void>;
  deletePlan(planId: string): Promise<void>;
  saveInstallment(installment: Installment): Promise<void>;
  deleteInstallment(installmentId: string): Promise<void>;
  saveCashBox(cashBox: CashBox): Promise<void>;
  deleteCashBox(cashBoxId: string): Promise<void>;
  saveMovement(movement: CashBoxMovement): Promise<void>;
  deleteMovement(movementId: string): Promise<void>;
  saveFreeBalanceWithdrawal(
    withdrawal: FreeBalanceWithdrawal,
    settings: Settings,
  ): Promise<void>;
  importBackup(backup: AppDataBackup): Promise<void>;
}
