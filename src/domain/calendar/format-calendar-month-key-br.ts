const MONTH_LABELS_BR = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

/** Formats `YYYY-MM` as `mmm/aaaa` (pt-BR, lowercase month abbrev). */
export function formatCalendarMonthKeyBr(monthKey: string): string {
  const [yearPart, monthPart] = monthKey.split('-');
  const month = Number(monthPart);
  const year = Number(yearPart);
  if (!year || month < 1 || month > 12) {
    throw new Error(`Invalid calendar month key: ${monthKey}`);
  }
  return `${MONTH_LABELS_BR[month - 1]}/${year}`;
}
