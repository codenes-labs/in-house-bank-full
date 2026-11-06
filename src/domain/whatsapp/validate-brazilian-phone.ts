export interface BrazilianPhoneValidation {
  valid: boolean;
  nationalDigits: string | null;
  error?: string;
}

export function onlyPhoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskBrazilianPhone(value: string): string {
  const digits = onlyPhoneDigits(value).slice(0, 11);
  if (digits.length === 0) {
    return '';
  }
  if (digits.length < 3) {
    return `(${digits}`;
  }
  const area = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) {
    return `(${area}) ${rest}`;
  }
  if (digits.length <= 10) {
    return `(${area}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  return `(${area}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

export function validateBrazilianPhone(raw: string): BrazilianPhoneValidation {
  const digits = onlyPhoneDigits(raw);
  if (!digits) {
    return { valid: false, nationalDigits: null, error: 'Informe o WhatsApp do pagador.' };
  }
  if (digits.length < 10 || digits.length > 11) {
    return { valid: false, nationalDigits: null, error: 'Use DDD e número, com 10 ou 11 dígitos.' };
  }

  const area = Number(digits.slice(0, 2));
  if (!Number.isInteger(area) || area < 11 || area > 99) {
    return { valid: false, nationalDigits: null, error: 'DDD inválido.' };
  }

  return { valid: true, nationalDigits: digits };
}
