import { PixKeyType, type PixKeyType as PixKeyTypeValue } from '../enums/pix-key-type';
import { isValidCnpj } from './validate-cnpj';
import { isValidCpf } from './validate-cpf';

const EMAIL_MAX_LENGTH = 77;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_PATTERN = /^\+55[1-9]\d{9,10}$/;

export interface PixKeyValidationResult {
  valid: boolean;
  type: PixKeyTypeValue | null;
  normalizedKey: string | null;
}

export function detectPixKeyType(raw: string): PixKeyTypeValue | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes('@')) {
    return PixKeyType.Email;
  }

  if (UUID_PATTERN.test(trimmed)) {
    return PixKeyType.Random;
  }

  if (looksLikePhone(trimmed)) {
    return PixKeyType.Phone;
  }

  const digits = onlyDigits(trimmed);
  if (digits.length === 11) {
    return PixKeyType.Cpf;
  }

  if (digits.length === 14) {
    return PixKeyType.Cnpj;
  }

  return null;
}

export function validatePixKey(raw: string): PixKeyValidationResult {
  const type = detectPixKeyType(raw);
  if (!type) {
    return invalid();
  }

  switch (type) {
    case PixKeyType.Email:
      return validateEmail(raw);
    case PixKeyType.Phone:
      return validatePhone(raw);
    case PixKeyType.Random:
      return validateRandom(raw);
    case PixKeyType.Cpf:
      return validateCpf(raw);
    case PixKeyType.Cnpj:
      return validateCnpj(raw);
    default:
      return invalid();
  }
}

function validateEmail(raw: string): PixKeyValidationResult {
  const normalizedKey = raw.trim().toLowerCase();
  if (normalizedKey.length > EMAIL_MAX_LENGTH || !isValidEmail(normalizedKey)) {
    return invalid();
  }

  return { valid: true, type: PixKeyType.Email, normalizedKey };
}

function validatePhone(raw: string): PixKeyValidationResult {
  const national = nationalPhoneDigits(onlyDigits(raw));
  if (!national) {
    return invalid();
  }

  const normalizedKey = `+55${national}`;
  if (!PHONE_PATTERN.test(normalizedKey)) {
    return invalid();
  }

  return { valid: true, type: PixKeyType.Phone, normalizedKey };
}

function looksLikePhone(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.startsWith('+') || /[()]/.test(trimmed)) {
    return true;
  }

  if (/[./]/.test(trimmed)) {
    return false;
  }

  const digits = onlyDigits(trimmed);
  if (digits.length === 11 && isValidCpf(digits)) {
    return false;
  }

  return nationalPhoneDigits(digits) !== null;
}

function nationalPhoneDigits(digits: string): string | null {
  const national = digits.startsWith('55') && (digits.length === 12 || digits.length === 13) ? digits.slice(2) : digits;
  if (!PHONE_PATTERN.test(`+55${national}`)) {
    return null;
  }

  return national;
}

function validateRandom(raw: string): PixKeyValidationResult {
  const normalizedKey = raw.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalizedKey)) {
    return invalid();
  }

  return { valid: true, type: PixKeyType.Random, normalizedKey };
}

function validateCpf(raw: string): PixKeyValidationResult {
  const normalizedKey = onlyDigits(raw);
  if (!isValidCpf(normalizedKey)) {
    return invalid();
  }

  return { valid: true, type: PixKeyType.Cpf, normalizedKey };
}

function validateCnpj(raw: string): PixKeyValidationResult {
  const normalizedKey = onlyDigits(raw);
  if (!isValidCnpj(normalizedKey)) {
    return invalid();
  }

  return { valid: true, type: PixKeyType.Cnpj, normalizedKey };
}

function isValidEmail(value: string): boolean {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return false;
  }

  const [localPart, domain] = value.split('@');
  return Boolean(localPart && domain && !localPart.endsWith('.'));
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function invalid(): PixKeyValidationResult {
  return { valid: false, type: null, normalizedKey: null };
}
