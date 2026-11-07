import { settingsAfterDeletingCashBox } from '../domain/cash-boxes/settings-after-deleting-cash-box';
import type { AppDataBackup } from '../domain/models/app-data-backup';
import type { CashBox } from '../domain/models/cash-box';
import type { CashBoxMovement } from '../domain/models/cash-box-movement';
import type { FreeBalanceWithdrawal } from '../domain/models/free-balance-withdrawal';
import type { Installment } from '../domain/models/installment';
import type { InstallmentPlan } from '../domain/models/installment-plan';
import type { Settings } from '../domain/models/settings';
import {
  createEmptySnapshot,
  snapshotFromBackup,
  type BankRepository,
  type BankSnapshot,
} from './bank-repository';

export function createMemoryBankRepository(initial?: BankSnapshot): BankRepository {
  let snapshot = initial ? structuredClone(initial) : createEmptySnapshot();

  return {
    async load() {
      return structuredClone(snapshot);
    },
    async saveSettings(settings: Settings) {
      snapshot = { ...snapshot, settings: structuredClone(settings) };
    },
    async savePlan(plan: InstallmentPlan) {
      snapshot = {
        ...snapshot,
        installmentPlans: upsert(snapshot.installmentPlans, plan),
      };
    },
    async deletePlan(planId: string) {
      snapshot = {
        ...snapshot,
        installmentPlans: snapshot.installmentPlans.filter((plan) => plan.id !== planId),
        installments: snapshot.installments.filter((installment) => installment.planId !== planId),
      };
    },
    async saveInstallment(installment: Installment) {
      snapshot = { ...snapshot, installments: upsert(snapshot.installments, installment) };
    },
    async deleteInstallment(installmentId: string) {
      snapshot = {
        ...snapshot,
        installments: snapshot.installments.filter((installment) => installment.id !== installmentId),
      };
    },
    async saveCashBox(cashBox: CashBox) {
      snapshot = { ...snapshot, cashBoxes: upsert(snapshot.cashBoxes, cashBox) };
    },
    async deleteCashBox(cashBoxId: string) {
      const deletedCashBox = snapshot.cashBoxes.find((cashBox) => cashBox.id === cashBoxId);
      snapshot = {
        ...snapshot,
        settings: settingsAfterDeletingCashBox(snapshot.settings, deletedCashBox),
        cashBoxes: snapshot.cashBoxes.filter((cashBox) => cashBox.id !== cashBoxId),
        cashBoxMovements: snapshot.cashBoxMovements.filter((movement) => movement.cashBoxId !== cashBoxId),
      };
    },
    async saveMovement(movement: CashBoxMovement) {
      snapshot = { ...snapshot, cashBoxMovements: upsert(snapshot.cashBoxMovements, movement) };
    },
    async deleteMovement(movementId: string) {
      snapshot = {
        ...snapshot,
        cashBoxMovements: snapshot.cashBoxMovements.filter((movement) => movement.id !== movementId),
      };
    },
    async saveFreeBalanceWithdrawal(withdrawal: FreeBalanceWithdrawal, settings: Settings) {
      snapshot = {
        ...snapshot,
        settings: structuredClone(settings),
        freeBalanceWithdrawals: upsert(snapshot.freeBalanceWithdrawals, withdrawal),
      };
    },
    async importBackup(backup: AppDataBackup) {
      snapshot = snapshotFromBackup(backup);
    },
  };
}

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((current) => current.id === item.id);
  if (index === -1) {
    return [...items, structuredClone(item)];
  }
  const next = [...items];
  next[index] = structuredClone(item);
  return next;
}
