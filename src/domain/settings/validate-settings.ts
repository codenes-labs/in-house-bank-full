import { normalizePixText } from '../pix/normalize-pix-text';
import { validatePixKey } from '../pix/validate-pix-key';
import { isValidCnpj } from '../pix/validate-cnpj';
import { isValidCpf } from '../pix/validate-cpf';
import type { Settings } from '../models/settings';

export type SettingsField = keyof Settings | 'document';

export type SettingsValidationErrors = Partial<Record<SettingsField, string>>;

export interface SettingsValidationResult {
  valid: boolean;
  errors: SettingsValidationErrors;
}

const CITY_MAX_LENGTH = 15;
const INSTALLMENTS_MIN = 1;
const INSTALLMENTS_MAX = 60;

export function validateSettings(settings: Settings): SettingsValidationResult {
  const errors: SettingsValidationErrors = {};

  if (!settings.businessName.trim()) {
    errors.businessName = 'Informe o nome da empresa.';
  }

  if (!settings.city.trim()) {
    errors.city = 'Informe a cidade do beneficiário.';
  } else if (normalizePixText(settings.city, CITY_MAX_LENGTH).length === 0) {
    errors.city = 'Cidade inválida para o BR Code Pix.';
  } else if (settings.city.trim().length > CITY_MAX_LENGTH) {
    errors.city = 'A cidade deve ter no máximo 15 caracteres.';
  }

  const pixValidation = validatePixKey(settings.defaultPixKey);
  if (!pixValidation.valid) {
    errors.defaultPixKey = 'Chave Pix padrão inválida.';
  }

  if (!settings.defaultInstitution.trim()) {
    errors.defaultInstitution = 'Informe a instituição padrão.';
  }

  if (
    !Number.isInteger(settings.defaultInstallments) ||
    settings.defaultInstallments < INSTALLMENTS_MIN ||
    settings.defaultInstallments > INSTALLMENTS_MAX
  ) {
    errors.defaultInstallments = 'Use entre 1 e 60 parcelas.';
  }

  if (settings.defaultDueDay !== undefined) {
    if (
      !Number.isInteger(settings.defaultDueDay) ||
      settings.defaultDueDay < 1 ||
      settings.defaultDueDay > 31
    ) {
      errors.defaultDueDay = 'O dia de vencimento deve estar entre 1 e 31.';
    }
  }

  if (settings.document?.trim()) {
    const digits = settings.document.replace(/\D/g, '');
    if (digits.length === 11) {
      if (!isValidCpf(digits)) {
        errors.document = 'CPF inválido.';
      }
    } else if (digits.length === 14) {
      if (!isValidCnpj(digits)) {
        errors.document = 'CNPJ inválido.';
      }
    } else {
      errors.document = 'Documento deve ser CPF ou CNPJ.';
    }
  }

  if (!Number.isFinite(settings.cdiAnnualPercent) || settings.cdiAnnualPercent < 0) {
    errors.cdiAnnualPercent = 'Informe um percentual de CDI válido.';
  } else if (settings.cdiAnnualPercent > 30) {
    errors.cdiAnnualPercent =
      'Use a taxa CDI anual em % (ex.: 10,5). Valores acima de 30 costumam ser o índice 100, não a taxa.';
  }

  if (!Number.isInteger(settings.freeBalanceCents) || settings.freeBalanceCents < 0) {
    errors.freeBalanceCents = 'Saldo livre inválido.';
  }

  if (settings.milestonesCents.some((value) => !Number.isInteger(value) || value <= 0)) {
    errors.milestonesCents = 'Marcos devem ser valores positivos em centavos.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
