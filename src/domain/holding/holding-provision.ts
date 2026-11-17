import { isHoldingAdminEmail } from './holding-admin';

export interface HoldingProvisionerSession {
  email: string;
  isDemo: boolean;
  holdingDelegate?: boolean;
}

/** Admin fixo ou conta empresa com delegação explícita (menu Holding). */
export function canProvisionHoldingCompanies(session: HoldingProvisionerSession): boolean {
  if (session.isDemo) {
    return false;
  }
  if (isHoldingAdminEmail(session.email)) {
    return true;
  }
  return session.holdingDelegate === true;
}

/** Só o e-mail admin altera permissões de outras contas. */
export function canManageHoldingAccounts(session: HoldingProvisionerSession): boolean {
  if (session.isDemo) {
    return false;
  }
  return isHoldingAdminEmail(session.email);
}