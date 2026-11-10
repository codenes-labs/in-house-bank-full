import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatCentsAsBrl } from '../domain/money/brl-input';
import { formatInstallmentDueDateRangeLabel } from '../domain/installments/installment-due-date-range';
import type { InstallmentDueDateRange } from '../domain/installments/installment-due-date-range';
import { formatCalendarDateBr } from '../domain/pdf/format-calendar-date-br';
import { LedgerDirection } from '../domain/ledger/ledger-direction';
import type { LedgerLine } from '../domain/ledger/ledger-line';
import type { Settings } from '../domain/models/settings';

export interface CashBoxExtratoPdfInput {
  title: string;
  period: InstallmentDueDateRange;
  lines: LedgerLine[];
  settings: Pick<Settings, 'businessName'>;
}

export async function generateCashBoxExtratoPdf(input: CashBoxExtratoPdfInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 48;
  let y = page.getHeight() - margin;

  const draw = (text: string, size: number, bold = false) => {
    page.drawText(text, {
      x: margin,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.1, 0.15, 0.25),
    });
    y -= size + 6;
  };

  draw(input.settings.businessName || 'In House Bank', 14, true);
  draw(input.title, 18, true);
  draw(`Período: ${formatInstallmentDueDateRangeLabel(input.period)}`, 11);
  y -= 8;

  const sorted = [...input.lines].sort((left, right) =>
    left.date < right.date ? 1 : left.date > right.date ? -1 : 0,
  );

  if (sorted.length === 0) {
    draw('Nenhum lançamento no período.', 11);
    return pdfDoc.save();
  }

  let activePage = page;
  for (const line of sorted) {
    if (y < margin + 40) {
      activePage = pdfDoc.addPage([595.28, 841.89]);
      y = activePage.getHeight() - margin;
    }
    const sign = line.direction === LedgerDirection.Out ? '-' : '+';
    const amount = `${sign}${formatCentsAsBrl(line.amountCents)}`;
    const row = `${formatCalendarDateBr(line.date)}  ${line.label}  ${amount}`;
    activePage.drawText(row, { x: margin, y, size: 10, font, color: rgb(0.15, 0.2, 0.3) });
    y -= 16;
  }

  return pdfDoc.save();
}
