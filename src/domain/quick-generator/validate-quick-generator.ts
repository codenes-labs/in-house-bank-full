import { parseCalendarDate } from '../calendar/calendar-date-parts';
import { validatePixKey } from '../pix/validate-pix-key';
import type { QuickGeneratorInput } from './quick-generator-input';

export type QuickGeneratorField = keyof QuickGeneratorInput;

export type QuickGeneratorErrors = Partial<Record<QuickGeneratorField, string>>;
export type QuickGeneratorWarnings = Partial<Record<'expectedProfit', string>>;

export interface QuickGeneratorValidationResult {
  valid: boolean;
  errors: QuickGeneratorErrors;
  warnings: QuickGeneratorWarnings;
}

const INSTALLMENTS_MIN = 1;
const INSTALLMENTS_MAX = 60;

export function validateQuickGenerator(input: QuickGeneratorInput): QuickGeneratorValidationResult {
  const errors: QuickGeneratorErrors = {};
  const warnings: QuickGeneratorWarnings = {};

  if (!Number.isInteger(input.usedAmountCents) || input.usedAmountCents <= 0) {
    errors.usedAmountCents = 'Informe um valor utilizado maior que zero.';
  }

  if (!Number.isInteger(input.returnAmountCents) || input.returnAmountCents <= 0) {
    errors.returnAmountCents = 'Informe um valor de retorno maior que zero.';
  }

  if (!input.reference.trim()) {
    errors.reference = 'Informe a referência.';
  }

  if (!input.borrowerName.trim()) {
    errors.borrowerName = 'Informe o nome do tomador.';
  }

  if (!input.beneficiary.trim()) {
    errors.beneficiary = 'Informe o beneficiário.';
  }

  if (!input.institution.trim()) {
    errors.institution = 'Informe a instituição.';
  }

  if (
    !Number.isInteger(input.installmentsCount) ||
    input.installmentsCount < INSTALLMENTS_MIN ||
    input.installmentsCount > INSTALLMENTS_MAX
  ) {
    errors.installmentsCount = 'Use entre 1 e 60 parcelas.';
  }

  if (!isValidCalendarDate(input.issueDate)) {
    errors.issueDate = 'Data de emissão inválida.';
  }

  if (!isValidCalendarDate(input.firstDueDate)) {
    errors.firstDueDate = 'Data de vencimento inválida.';
  }

  const pixValidation = validatePixKey(input.pixKey);
  if (!pixValidation.valid) {
    errors.pixKey = 'Chave Pix inválida.';
  }

  if (
    Number.isInteger(input.usedAmountCents) &&
    Number.isInteger(input.returnAmountCents) &&
    input.returnAmountCents < input.usedAmountCents
  ) {
    warnings.expectedProfit = 'O retorno é menor que o valor utilizado (lucro previsto negativo).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

function isValidCalendarDate(value: string): boolean {
  try {
    parseCalendarDate(value);
    return true;
  } catch {
    return false;
  }
}
