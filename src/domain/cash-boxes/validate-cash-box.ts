export interface CashBoxInput {
  name: string;
  institution: string;
  cdiPercent: number;
  limitCents?: number;
  balanceCents: number;
}

export type CashBoxValidationErrors = Partial<
  Record<'name' | 'institution' | 'cdiPercent' | 'limitCents' | 'balanceCents', string>
>;

export function validateCashBoxInput(input: CashBoxInput): {
  valid: boolean;
  errors: CashBoxValidationErrors;
} {
  const errors: CashBoxValidationErrors = {};

  if (!input.name.trim()) {
    errors.name = 'Informe o nome da caixinha.';
  }
  if (!input.institution.trim()) {
    errors.institution = 'Informe a instituição.';
  }
  if (!Number.isFinite(input.cdiPercent) || input.cdiPercent <= 0) {
    errors.cdiPercent = 'Informe um percentual do CDI maior que zero.';
  }
  if (input.limitCents !== undefined && input.limitCents <= 0) {
    errors.limitCents = 'O limite deve ser maior que zero.';
  }
  if (!Number.isInteger(input.balanceCents) || input.balanceCents < 0) {
    errors.balanceCents = 'Saldo inválido.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
