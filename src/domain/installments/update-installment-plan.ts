import type { InstallmentPlan } from '../models/installment-plan';
import { validatePixKey } from '../pix/validate-pix-key';

export interface InstallmentPlanUpdateInput {
  reference: string;
  borrowerName: string;
  beneficiary: string;
  pixKey: string;
  institution: string;
  payerPhone?: string;
  paymentInstructions?: string;
  responsibilityTerm?: string;
}

export type InstallmentPlanUpdateError =
  | 'EMPTY_REFERENCE'
  | 'EMPTY_BORROWER'
  | 'EMPTY_BENEFICIARY'
  | 'EMPTY_INSTITUTION'
  | 'INVALID_PIX_KEY';

export type InstallmentPlanUpdateResult =
  | { ok: true; plan: InstallmentPlan; pixFieldsChanged: boolean }
  | { ok: false; errors: Partial<Record<keyof InstallmentPlanUpdateInput, string>> };

export function applyInstallmentPlanUpdate(
  plan: InstallmentPlan,
  input: InstallmentPlanUpdateInput,
): InstallmentPlanUpdateResult {
  const errors: Partial<Record<keyof InstallmentPlanUpdateInput, string>> = {};
  const reference = input.reference.trim();
  const borrowerName = input.borrowerName.trim();
  const beneficiary = input.beneficiary.trim();
  const institution = input.institution.trim();
  const pixKeyRaw = input.pixKey.trim();

  if (!reference) {
    errors.reference = 'Informe a referência.';
  }
  if (!borrowerName) {
    errors.borrowerName = 'Informe o tomador.';
  }
  if (!beneficiary) {
    errors.beneficiary = 'Informe o beneficiário.';
  }
  if (!institution) {
    errors.institution = 'Informe a instituição.';
  }

  const pixValidation = validatePixKey(pixKeyRaw);
  if (!pixValidation.valid) {
    errors.pixKey = 'Chave Pix inválida.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const pixKey = pixValidation.normalizedKey ?? pixKeyRaw;
  const pixFieldsChanged = plan.pixKey !== pixKey || plan.beneficiary !== beneficiary;

  return {
    ok: true,
    plan: {
      ...plan,
      reference,
      borrowerName,
      beneficiary,
      pixKey,
      institution,
      payerPhone: input.payerPhone !== undefined ? input.payerPhone.trim() : plan.payerPhone,
      paymentInstructions:
        input.paymentInstructions !== undefined
          ? input.paymentInstructions.trim()
          : plan.paymentInstructions,
      responsibilityTerm:
        input.responsibilityTerm !== undefined
          ? input.responsibilityTerm.trim()
          : plan.responsibilityTerm,
    },
    pixFieldsChanged,
  };
}
