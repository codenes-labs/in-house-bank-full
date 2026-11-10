const CSV_SEPARATOR = ';';

export function escapeCsvCell(value: string | number): string {
  const text = String(value);
  if (/["\n\r;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function csvRow(cells: Array<string | number>): string {
  return cells.map(escapeCsvCell).join(CSV_SEPARATOR);
}
