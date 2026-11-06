import {
  DefaultInterestType,
  type DefaultInterestType as DefaultInterestTypeValue,
} from '../enums/default-interest-type';
import type { ThemeMode } from '../theme/theme-mode';
import { DEFAULT_WHATSAPP_MESSAGE } from '../whatsapp/default-whatsapp-message';

export interface Settings {
  businessName: string;
  document?: string;
  city: string;
  defaultPixKey: string;
  defaultInstitution: string;
  defaultInstallments: number;
  defaultDueDay?: number;
  defaultInterestType: DefaultInterestTypeValue;
  theme: ThemeMode;
  cdiAnnualPercent: number;
  milestonesCents: number[];
  freeBalanceCents: number;
  pdfFooterText?: string;
  paymentInstructions?: string;
  responsibilityTerm?: string;
  whatsappMessageTemplate?: string;
  logoDataUrl?: string;
}

export function createEmptySettings(): Settings {
  return {
    businessName: '',
    city: '',
    defaultPixKey: '',
    defaultInstitution: '',
    defaultInstallments: 1,
    defaultInterestType: DefaultInterestType.Simple,
    theme: 'light',
    cdiAnnualPercent: 0,
    milestonesCents: [],
    freeBalanceCents: 0,
    whatsappMessageTemplate: DEFAULT_WHATSAPP_MESSAGE,
  };
}
