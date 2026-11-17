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

/** Cadastro, senha consultável e permissões no detalhe holding. */
export function canAdminEditHoldingAccess(profile: HoldingAccountProfile): boolean {
  return (
    profile === HoldingAccountProfile.Company ||
    profile === HoldingAccountProfile.Administration ||
    profile === HoldingAccountProfile.Demo
  );
}

/** E-mail de login só muda em contas empresa (admin/demo são contas de sistema). */
export function canAdminEditHoldingLoginEmail(profile: HoldingAccountProfile): boolean {
  return profile === HoldingAccountProfile.Company;
}

export function isHoldingSystemAccountProfile(profile: HoldingAccountProfile): boolean {
  return profile === HoldingAccountProfile.Administration || profile === HoldingAccountProfile.Demo;
}

/** Administração: menu fixo. Empresa e demonstração: editável no holding. */
export function canAdminEditHoldingMenuAccess(profile: HoldingAccountProfile): boolean {
  return profile === HoldingAccountProfile.Company || profile === HoldingAccountProfile.Demo;
}

export function canAdminEditHoldingMustChangePassword(profile: HoldingAccountProfile): boolean {
  return profile === HoldingAccountProfile.Company;
}