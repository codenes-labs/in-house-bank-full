import type { Settings } from '../models/settings';
import type { InstallmentPlan } from '../models/installment-plan';

export function settingsCarneTextDefaults(settings: Settings): {
  paymentInstructions: string;
  responsibilityTerm: string;
} {
  return {
    paymentInstructions: settings.paymentInstructions?.trim() || settings.pdfFooterText?.trim() || '',
    responsibilityTerm: settings.responsibilityTerm?.trim() || '',
  };
}

export function planCarneTextsForEdit(
  plan: InstallmentPlan,
  settings: Settings,
): { paymentInstructions: string; responsibilityTerm: string; usesPlanOverride: boolean } {
  const defaults = settingsCarneTextDefaults(settings);
  const planInstructions = plan.paymentInstructions?.trim() ?? '';
  const planTerm = plan.responsibilityTerm?.trim() ?? '';
  return {
    paymentInstructions: planInstructions || defaults.paymentInstructions,
    responsibilityTerm: planTerm || defaults.responsibilityTerm,
    usesPlanOverride: Boolean(planInstructions || planTerm),
  };
}

/** Grava override só quando difere do modelo em Ajustes; vazio remove override do plano. */
export function planCarneTextOverride(raw: string, settingsDefault: string): string | undefined {
  const trimmed = raw.trim();
  const base = settingsDefault.trim();
  if (!trimmed || trimmed === base) {
    return undefined;
  }
  return trimmed;
}
