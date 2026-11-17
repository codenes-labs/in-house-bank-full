import { HoldingAccountProfile } from './holding-account-profile';
import { holdingSystemRegistrationCode } from './company-registration-code';

export function effectiveHoldingRegistrationCode(
  profile: HoldingAccountProfile,
  storedCode: string | null | undefined,
): string | null {
  const trimmed = String(storedCode ?? '').trim();
  if (trimmed.length > 0) {
    return trimmed;
  }
  if (profile === HoldingAccountProfile.Administration) {
    return holdingSystemRegistrationCode('administration');
  }
  if (profile === HoldingAccountProfile.Demo) {
    return holdingSystemRegistrationCode('demo');
  }
  return null;
}

export function holdingCompanyListSortKey(
  profile: HoldingAccountProfile,
  registrationCode: string | null | undefined,
): number {
  const code = effectiveHoldingRegistrationCode(profile, registrationCode);
  if (code && /^\d+$/.test(code)) {
    return Number(code);
  }
  return Number.MAX_SAFE_INTEGER;
}