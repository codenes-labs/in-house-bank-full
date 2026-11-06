import type { InstallmentPlan } from '../models/installment-plan';
import type { Settings } from '../models/settings';

export const DEFAULT_CARNE_FOOTER =
  'In House Bank | Recorte pelo canhoto tracejado e entregue após o pagamento.';

export function resolveCarneFooterText(plan: InstallmentPlan, settings: Settings): string {
  const instructions =
    plan.paymentInstructions?.trim() ||
    settings.paymentInstructions?.trim() ||
    settings.pdfFooterText?.trim() ||
    DEFAULT_CARNE_FOOTER;
  const term = plan.responsibilityTerm?.trim() || settings.responsibilityTerm?.trim() || '';
  return term ? `${instructions} ${term}` : instructions;
}
