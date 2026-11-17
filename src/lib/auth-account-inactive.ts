export const AUTH_ACCOUNT_INACTIVE_EVENT = 'ihb:account-inactive';

export function dispatchAccountInactive(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(AUTH_ACCOUNT_INACTIVE_EVENT));
}

export function isAccountInactiveApiBody(
  status: number,
  body: { accountInactive?: boolean } | null,
): boolean {
  return status === 403 && body?.accountInactive === true;
}