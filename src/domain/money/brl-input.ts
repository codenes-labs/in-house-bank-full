export function brlStringToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/\./g, '').replace(',', '.');
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100);
}

export function formatCentsAsBrl(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
