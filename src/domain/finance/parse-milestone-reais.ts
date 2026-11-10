export function maskMilestoneReaisInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (!digits) {
    return '';
  }
  return Number(digits).toLocaleString('pt-BR');
}

export function parseMilestoneReaisToCents(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return null;
  }
  const reais = Number(digits);
  if (!Number.isFinite(reais) || reais <= 0) {
    return null;
  }
  return reais * 100;
}

export function sortMilestonesCents(values: number[]): number[] {
  return [...values].filter((value) => value > 0).sort((a, b) => a - b);
}
