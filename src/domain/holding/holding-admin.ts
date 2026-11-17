export const HOLDING_ADMIN_EMAIL = 'admin@codenes.com.br';

export function isHoldingAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === HOLDING_ADMIN_EMAIL;
}