import type { CashBoxMovement } from './cash-box-movement';
import type { CashBox } from './cash-box';
import type { FreeBalanceDeposit } from './free-balance-deposit';
import type { FreeBalanceWithdrawal } from './free-balance-withdrawal';
import type { InstallmentPlan } from './installment-plan';
import type { Installment } from './installment';
import type { Settings } from './settings';

export const APP_DATA_BACKUP_VERSION = 1;

export interface AppDataBackup {
  version: number;
  settings: Settings;
  installmentPlans: InstallmentPlan[];
  installments: Installment[];
  cashBoxes: CashBox[];
  cashBoxMovements: CashBoxMovement[];
  freeBalanceWithdrawals: FreeBalanceWithdrawal[];
  freeBalanceDeposits: FreeBalanceDeposit[];
}
