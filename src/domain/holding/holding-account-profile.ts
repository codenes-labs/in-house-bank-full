import { isHoldingAdminEmail } from './holding-admin';

export const HoldingAccountProfile = {
  Administration: 'administration',
  Demo: 'demo',
  Company: 'company',
} as const;

export type HoldingAccountProfile = (typeof HoldingAccountProfile)[keyof typeof HoldingAccountProfile];

export function holdingAccountProfileLabel(profile: HoldingAccountProfile): string {
  switch (profile) {
    case HoldingAccountProfile.Administration:
      return 'Administração';
    case HoldingAccountProfile.Demo:
      return 'Demonstração';
    case HoldingAccountProfile.Company:
      return 'Empresa';
  }
}

export function resolveHoldingAccountProfile(email: string, accountKind: string): HoldingAccountProfile {
  if (isHoldingAdminEmail(email)) {
    return HoldingAccountProfile.Administration;
  }
  if (accountKind === 'demo') {
    return HoldingAccountProfile.Demo;
  }
  return HoldingAccountProfile.Company;
}

export function canAdminEditHoldingAccess(profile: HoldingAccountProfile): boolean {
  return profile === HoldingAccountProfile.Company;
}