import { HoldingAccountProfile } from './holding-account-profile';

export function canToggleHoldingAccountActive(profile: HoldingAccountProfile): boolean {
  return profile === HoldingAccountProfile.Company || profile === HoldingAccountProfile.Demo;
}

export type HoldingAccountAccessTone = 'paid' | 'pending' | 'overdue';

export function holdingAccountAccessStatus(
  accountActive: boolean,
  mustChangePassword: boolean,
): { label: string; tone: HoldingAccountAccessTone } {
  if (!accountActive) {
    return { label: 'Inativo', tone: 'overdue' };
  }
  if (mustChangePassword) {
    return { label: 'Senha pendente', tone: 'pending' };
  }
  return { label: 'Ativo', tone: 'paid' };
}