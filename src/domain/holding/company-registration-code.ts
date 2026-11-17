/** Contas de sistema — 6 dígitos, abaixo da faixa de empresas (100001+). */
export const HOLDING_REGISTRATION_ADMIN = '001001';
export const HOLDING_REGISTRATION_DEMO = '001002';

/** Primeiro ID numérico de empresa (6 dígitos). */
export const HOLDING_COMPANY_REGISTRATION_START = 100_001;

export function holdingSystemRegistrationCode(profile: 'administration' | 'demo'): string {
  return profile === 'administration' ? HOLDING_REGISTRATION_ADMIN : HOLDING_REGISTRATION_DEMO;
}

/** Exibe o ID cadastro só com dígitos; contas de sistema em 6 dígitos. */
export function formatRegistrationCodeDisplay(code: string | null | undefined): string {
  if (!code?.trim()) {
    return '—';
  }
  const trimmed = code.trim();
  const digits = /^\d+$/.test(trimmed) ? trimmed : trimmed.replace(/\D/g, '');
  if (digits.length === 0) {
    return '—';
  }
  const numeric = Number(digits);
  if (numeric < HOLDING_COMPANY_REGISTRATION_START) {
    return digits.padStart(6, '0').slice(-6);
  }
  return digits;
}

export function isCompanyRegistrationNumber(code: string): boolean {
  return /^\d+$/.test(code) && Number(code) >= HOLDING_COMPANY_REGISTRATION_START;
}

export function isHoldingSystemRegistrationCode(code: string | null | undefined): boolean {
  const digits = String(code ?? '').trim();
  if (!/^\d+$/.test(digits)) {
    return false;
  }
  const numeric = Number(digits);
  return numeric < HOLDING_COMPANY_REGISTRATION_START;
}