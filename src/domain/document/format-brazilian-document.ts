export function onlyDocumentDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 14);
}

export function maskBrazilianDocumentInput(value: string): string {
  const digits = onlyDocumentDigits(value);
  if (digits.length <= 11) {
    return maskCpfDigits(digits);
  }
  return maskCnpjDigits(digits);
}

export function formatBrazilianDocumentDisplay(stored: string | null | undefined): string {
  const trimmed = String(stored ?? '').trim();
  if (!trimmed) {
    return '';
  }
  return maskBrazilianDocumentInput(trimmed);
}

function maskCpfDigits(digits: string): string {
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 9),
    digits.slice(9, 11),
  ].filter((part, index) => part.length > 0 || index === 0);
  if (digits.length <= 3) {
    return parts[0] ?? '';
  }
  if (digits.length <= 6) {
    return `${parts[0]}.${parts[1]}`;
  }
  if (digits.length <= 9) {
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  return `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}`;
}

function maskCnpjDigits(digits: string): string {
  const d = digits.slice(0, 14);
  if (d.length <= 2) {
    return d;
  }
  if (d.length <= 5) {
    return `${d.slice(0, 2)}.${d.slice(2)}`;
  }
  if (d.length <= 8) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  }
  if (d.length <= 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}