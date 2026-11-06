import type { GeneratedInstallmentPlanBundle } from '../domain/quick-generator/create-installment-plan-from-generator';

const DRAFT_KEY = 'in-house-bank.generatorDraft';
const BUNDLE_KEY = 'in-house-bank.pendingBundle';

export interface GeneratorDraft {
  usedAmount: string;
  returnAmount: string;
  type: string;
  reference: string;
  borrowerName: string;
  issueDate: string;
  firstDueDate: string;
  installmentsCount: string;
  pixKey: string;
  beneficiary: string;
  institution: string;
  city: string;
  ratePercent: string;
}

export function readGeneratorDraft(): Partial<GeneratorDraft> | null {
  return readJson(DRAFT_KEY);
}

export function writeGeneratorDraft(draft: GeneratorDraft): void {
  writeJson(DRAFT_KEY, draft);
}

export function readPendingBundle(): GeneratedInstallmentPlanBundle | null {
  return readJson(BUNDLE_KEY);
}

export function writePendingBundle(bundle: GeneratedInstallmentPlanBundle | null): void {
  if (!bundle) {
    sessionStorageSafe()?.removeItem(BUNDLE_KEY);
    return;
  }
  writeJson(BUNDLE_KEY, bundle);
}

function readJson<T>(key: string): T | null {
  const raw = sessionStorageSafe()?.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  sessionStorageSafe()?.setItem(key, JSON.stringify(value));
}

function sessionStorageSafe(): Storage | null {
  return typeof sessionStorage === 'undefined' ? null : sessionStorage;
}
