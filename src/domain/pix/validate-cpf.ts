export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11) {
    return false;
  }

  if (isRepeatedDigit(digits)) {
    return false;
  }

  const firstCheck = calculateCpfCheckDigit(digits.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (firstCheck !== Number(digits[9])) {
    return false;
  }

  const secondCheck = calculateCpfCheckDigit(digits.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return secondCheck === Number(digits[10]);
}

function calculateCpfCheckDigit(base: string, weights: number[]): number {
  const sum = base
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function isRepeatedDigit(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}
