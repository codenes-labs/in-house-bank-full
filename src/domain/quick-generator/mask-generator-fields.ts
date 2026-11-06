import { formatCentsAsBrl } from '../money/brl-input';

const MONEY_DIGITS = 9;
const RATE_WHOLE_DIGITS = 3;

export function maskMoneyField(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^0+/, '').slice(0, MONEY_DIGITS);
  if (!digits) {
    return '';
  }
  return formatCentsAsBrl(Number(digits));
}

export function maskMonthlyRate(value: string): string {
  return maskDecimal(value, RATE_WHOLE_DIGITS, 2);
}

export function maskInstallmentCount(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 2);
  if (!digits) {
    return '';
  }
  return String(Math.min(Number(digits), 60));
}

function maskDecimal(value: string, wholeLimit: number, fractionLimit: number): string {
  const cleaned = value.replace(/[^\d,]/g, '');
  const commaAt = cleaned.indexOf(',');
  const whole = (commaAt === -1 ? cleaned : cleaned.slice(0, commaAt)).replace(/\D/g, '').slice(0, wholeLimit);
  if (commaAt === -1) {
    return whole;
  }
  const fraction = cleaned.slice(commaAt + 1).replace(/\D/g, '').slice(0, fractionLimit);
  return `${whole},${fraction}`;
}
