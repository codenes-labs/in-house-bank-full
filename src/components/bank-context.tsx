import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppDataBackup } from '../domain/models/app-data-backup';
import type { CashBox } from '../domain/models/cash-box';
import type { CashBoxMovement } from '../domain/models/cash-box-movement';
import type { FreeBalanceWithdrawal } from '../domain/models/free-balance-withdrawal';
import type { Installment } from '../domain/models/installment';
import type { InstallmentPlan } from '../domain/models/installment-plan';
import type { Settings } from '../domain/models/settings';
import type { GeneratedInstallmentPlanBundle } from '../domain/quick-generator/create-installment-plan-from-generator';
import { createEmptySnapshot, type BankSnapshot } from '../repositories/bank-repository';
import { createHttpBankRepository } from '../repositories/http-bank-repository';
import type { BankRepository } from '../repositories/bank-repository';
import { useAuth } from './auth-context';
import { useTheme } from './theme';

interface BankContextValue {
  ready: boolean;
  error: string | null;
  snapshot: BankSnapshot;
  saveSettings: (settings: Settings) => Promise<void>;
  saveBundle: (bundle: GeneratedInstallmentPlanBundle) => Promise<void>;
  savePlan: (plan: InstallmentPlan) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  saveInstallment: (installment: Installment) => Promise<void>;
  deleteInstallment: (installmentId: string) => Promise<void>;
  saveCashBox: (cashBox: CashBox) => Promise<void>;
  deleteCashBox: (cashBoxId: string) => Promise<void>;
  saveMovement: (movement: CashBoxMovement) => Promise<void>;
  deleteMovement: (movementId: string) => Promise<void>;
  saveFreeBalanceWithdrawal: (withdrawal: FreeBalanceWithdrawal, settings: Settings) => Promise<void>;
  importBackup: (backup: AppDataBackup) => Promise<void>;
}

const BankContext = createContext<BankContextValue | null>(null);

export function BankProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { setMode } = useTheme();
  const [snapshot, setSnapshot] = useState<BankSnapshot>(createEmptySnapshot());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) {
      setSnapshot(createEmptySnapshot());
      setReady(true);
      setError(null);
      return;
    }
    const repository = createHttpBankRepository();
    let active = true;
    setReady(false);
    void repository
      .load()
      .then((loaded) => {
        if (!active) {
          return;
        }
        setSnapshot(loaded);
        setMode(loaded.settings.theme);
        setError(null);
        setReady(true);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os dados.');
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, [setMode, userId]);

  const value = useMemo<BankContextValue>(() => {
    const repository: BankRepository | null = userId ? createHttpBankRepository() : null;

    async function run(work: (repo: BankRepository) => Promise<void>): Promise<void> {
      if (!repository) {
        throw new Error('Entre na conta para salvar.');
      }
      await work(repository);
      setSnapshot(await repository.load());
    }

    return {
      ready,
      error,
      snapshot,
      saveSettings: (settings) => run((repo) => repo.saveSettings(settings)),
      saveBundle: (bundle) =>
        run(async (repo) => {
          await repo.savePlan(bundle.plan);
          for (const installment of bundle.installments) {
            await repo.saveInstallment(installment);
          }
        }),
      savePlan: (plan) => run((repo) => repo.savePlan(plan)),
      deletePlan: (planId) => run((repo) => repo.deletePlan(planId)),
      saveInstallment: (installment) => run((repo) => repo.saveInstallment(installment)),
      deleteInstallment: (installmentId) => run((repo) => repo.deleteInstallment(installmentId)),
      saveCashBox: (cashBox) => run((repo) => repo.saveCashBox(cashBox)),
      deleteCashBox: (cashBoxId) => run((repo) => repo.deleteCashBox(cashBoxId)),
      saveMovement: (movement) => run((repo) => repo.saveMovement(movement)),
      deleteMovement: (movementId) => run((repo) => repo.deleteMovement(movementId)),
      saveFreeBalanceWithdrawal: (withdrawal, settings) =>
        run((repo) => repo.saveFreeBalanceWithdrawal(withdrawal, settings)),
      importBackup: (backup) => run((repo) => repo.importBackup(backup)),
    };
  }, [error, ready, snapshot, userId]);

  return <BankContext.Provider value={value}>{children}</BankContext.Provider>;
}

export function useBank(): BankContextValue {
  const value = useContext(BankContext);
  if (!value) {
    throw new Error('useBank must be used inside BankProvider');
  }
  return value;
}
