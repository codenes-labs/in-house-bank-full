export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14) {
    return false;
  }

  if (isRepeatedDigit(digits)) {
    return false;
  }

  const firstCheck = calculateCnpjCheckDigit(
    digits.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  if (firstCheck !== Number(digits[12])) {
    return false;
  }

  const secondCheck = calculateCnpjCheckDigit(
    digits.slice(0, 13),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  return secondCheck === Number(digits[13]);
}

function calculateCnpjCheckDigit(base: string, weights: number[]): number {
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
