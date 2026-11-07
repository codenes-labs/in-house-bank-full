const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export function formatCashBoxMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const monthIndex = Number(month) - 1;
  if (!year || monthIndex < 0 || monthIndex > 11) {
    return yearMonth;
  }
  return `${MONTH_NAMES[monthIndex]} de ${year}`;
}
