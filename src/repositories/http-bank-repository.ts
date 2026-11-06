import type { AppDataBackup } from '../domain/models/app-data-backup';
import type { CashBox } from '../domain/models/cash-box';
import type { CashBoxMovement } from '../domain/models/cash-box-movement';
import type { Installment } from '../domain/models/installment';
import type { InstallmentPlan } from '../domain/models/installment-plan';
import type { Settings } from '../domain/models/settings';
import { authRequestInit } from '../lib/auth-token';
import type { BankRepository, BankSnapshot } from './bank-repository';

export function createHttpBankRepository(): BankRepository {
  return {
    load: () => request<BankSnapshot>('/api/bank', authRequestInit()),
    saveSettings: (settings) => send('/api/bank/settings', 'PUT', settings),
    savePlan: (plan) => send('/api/bank/plans', 'PUT', plan),
    deletePlan: (planId) => send(`/api/bank/plans/${planId}`, 'DELETE'),
    saveInstallment: (installment) => send('/api/bank/installments', 'PUT', installment),
    deleteInstallment: (installmentId) => send(`/api/bank/installments/${installmentId}`, 'DELETE'),
    saveCashBox: (cashBox) => send('/api/bank/cash-boxes', 'PUT', cashBox),
    deleteCashBox: (cashBoxId) => send(`/api/bank/cash-boxes/${cashBoxId}`, 'DELETE'),
    saveMovement: (movement) => send('/api/bank/movements', 'PUT', movement),
    deleteMovement: (movementId) => send(`/api/bank/movements/${movementId}`, 'DELETE'),
    importBackup: (backup) => send('/api/bank/import', 'POST', backup),
  };
}

async function send(
  path: string,
  method: string,
  body?: Settings | InstallmentPlan | Installment | CashBox | CashBoxMovement | AppDataBackup,
): Promise<void> {
  await request(path, authRequestInit({
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'content-type': 'application/json' } : undefined,
  }));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'Não foi possível falar com o banco.');
  }
  return (await response.json()) as T;
}
