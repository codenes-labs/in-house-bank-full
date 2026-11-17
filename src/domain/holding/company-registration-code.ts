/** Contas de sistema na coluna ID cadastro (só dígitos). */
export const HOLDING_REGISTRATION_ADMIN = '0';
export const HOLDING_REGISTRATION_DEMO = '1';

/** Primeiro ID numérico de empresa (6 dígitos na exibição). */
export const HOLDING_COMPANY_REGISTRATION_START = 100_001;

export function holdingSystemRegistrationCode(profile: 'administration' | 'demo'): string {
  return profile === 'administration' ? HOLDING_REGISTRATION_ADMIN : HOLDING_REGISTRATION_DEMO;
}

/** Exibe o ID cadastro só com dígitos (sem prefixo REG legado). */
export function formatRegistrationCodeDisplay(code: string | null | undefined): string {
  if (!code?.trim()) {
    return '—';
  }
  const trimmed = code.trim();
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }
  const digits = trimmed.replace(/\D/g, '');
  return digits.length > 0 ? digits : '—';
}

export function isCompanyRegistrationNumber(code: string): boolean {
  return /^\d{6,}$/.test(code) && Number(code) >= HOLDING_COMPANY_REGISTRATION_START;
}