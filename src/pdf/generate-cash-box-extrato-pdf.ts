import { PDFDocument, StandardFonts, type PDFPage, type PDFFont } from 'pdf-lib';
import { formatCentsAsBrl } from '../domain/money/brl-input';
import { formatInstallmentDueDateRangeLabel } from '../domain/installments/installment-due-date-range';
import type { InstallmentDueDateRange } from '../domain/installments/installment-due-date-range';
import { groupLedgerLinesByMonth } from '../domain/ledger/group-ledger-lines-by-month';
import { LedgerDirection } from '../domain/ledger/ledger-direction';
import type { LedgerLine } from '../domain/ledger/ledger-line';
import type { Settings } from '../domain/models/settings';
import { formatCalendarDateBr } from '../domain/pdf/format-calendar-date-br';
import { embedDataUrlImage } from './embed-data-url-image';
import { EXTRATO_PDF } from './extrato-pdf-colors';
import { drawAccentCapsule, drawRoundedRect, drawRoundedRectBorder } from './pdf-draw';

export interface CashBoxExtratoPdfInput {
  title: string;
  period: InstallmentDueDateRange;
  lines: LedgerLine[];
  settings: Pick<Settings, 'businessName' | 'logoDataUrl'>;
}

const CONTENT_INSET = 12;

type PageState = {
  pdfDoc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  fontBold: PDFFont;
  logo: Awaited<ReturnType<typeof embedDataUrlImage>>;
  input: CashBoxExtratoPdfInput;
};

function contentWidth(): number {
  return EXTRATO_PDF.pageWidth - EXTRATO_PDF.margin * 2 - CONTENT_INSET * 2;
}

function contentX(): number {
  return EXTRATO_PDF.margin + CONTENT_INSET;
}

export async function generateCashBoxExtratoPdf(input: CashBoxExtratoPdfInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logo = await embedDataUrlImage(pdfDoc, input.settings.logoDataUrl);

  const state: PageState = {
    pdfDoc,
    page: pdfDoc.addPage([EXTRATO_PDF.pageWidth, EXTRATO_PDF.pageHeight]),
    y: 0,
    font,
    fontBold,
    logo,
    input,
  };

  startContentArea(state);
  const sorted = [...input.lines].sort((left, right) =>
    left.date < right.date ? 1 : left.date > right.date ? -1 : 0,
  );

  if (sorted.length === 0) {
    drawEmptyState(state);
    drawFooter(state.page, font);
    return pdfDoc.save();
  }

  const groups = groupLedgerLinesByMonth(sorted);
  let rowIndex = 0;
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const group = groups[groupIndex];
    const blockHeight = estimateMonthBlockHeight(group.lines.length);
    ensureSpace(state, blockHeight + 36);
    state.y -= 6;
    drawMonthPill(state, group.label);
    state.y -= 28;

    const blockTop = state.y;
    const blockBottom = blockTop - blockHeight;
    drawRoundedRectBorder(
      state.page,
      EXTRATO_PDF.margin,
      blockBottom,
      EXTRATO_PDF.pageWidth - EXTRATO_PDF.margin * 2,
      blockHeight,
      EXTRATO_PDF.contentRadius,
      EXTRATO_PDF.white,
      EXTRATO_PDF.border,
      1,
    );

    state.y = blockTop - 8;
    drawTableHeader(state);
    state.y -= 22;

    for (const line of group.lines) {
      drawLedgerRow(state, line, rowIndex % 2 === 1);
      state.y -= 22;
      rowIndex += 1;
    }

    state.y = blockBottom - 14;
  }

  drawFooter(state.page, font);
  return pdfDoc.save();
}

function estimateMonthBlockHeight(lineCount: number): number {
  return 8 + 22 + lineCount * 22 + 8;
}

function startContentArea(state: PageState) {
  drawPageHeader(state);
  state.y = EXTRATO_PDF.pageHeight - EXTRATO_PDF.margin - EXTRATO_PDF.headerHeight - 28;
}

function ensureSpace(state: PageState, needed: number) {
  if (state.y - needed >= EXTRATO_PDF.margin + 32) {
    return;
  }
  drawFooter(state.page, state.font);
  state.page = state.pdfDoc.addPage([EXTRATO_PDF.pageWidth, EXTRATO_PDF.pageHeight]);
  startContentArea(state);
}

function drawPageHeader(state: PageState) {
  const { page, font, fontBold, logo, input } = state;
  const barHeight = EXTRATO_PDF.headerHeight;
  const barY = EXTRATO_PDF.pageHeight - EXTRATO_PDF.margin - barHeight;
  const barWidth = EXTRATO_PDF.pageWidth - EXTRATO_PDF.margin * 2;
  const brand = input.settings.businessName?.trim() || 'In House Bank';

  drawRoundedRectBorder(
    page,
    EXTRATO_PDF.margin,
    barY,
    barWidth,
    barHeight,
    16,
    EXTRATO_PDF.successSoft,
    EXTRATO_PDF.border,
    1,
  );

  const logoSize = 36;
  const logoX = EXTRATO_PDF.margin + 14;
  const logoY = barY + (barHeight - logoSize) / 2;
  if (logo) {
    page.drawImage(logo, { x: logoX, y: logoY, width: logoSize, height: logoSize });
  } else {
    drawBrandMark(page, fontBold, logoX, logoY + logoSize, logoSize);
  }

  const textX = logoX + logoSize + 12;
  page.drawText(brand, {
    x: textX,
    y: barY + barHeight - 20,
    size: 10,
    font: fontBold,
    color: EXTRATO_PDF.primary,
  });
  page.drawText(input.title, {
    x: textX,
    y: barY + barHeight - 38,
    size: 15,
    font: fontBold,
    color: EXTRATO_PDF.text,
  });
  page.drawText(`Período: ${formatInstallmentDueDateRangeLabel(input.period)}`, {
    x: textX,
    y: barY + 12,
    size: 9,
    font,
    color: EXTRATO_PDF.muted,
  });

  drawAccentCapsule(page, EXTRATO_PDF.margin + barWidth - 48, barY + barHeight / 2 - 2, 32, 4, EXTRATO_PDF.accent);
}

function drawBrandMark(page: PDFPage, fontBold: PDFFont, x: number, topY: number, size: number) {
  const centerY = topY - size / 2;
  page.drawCircle({ x: x + size / 2, y: centerY, size: size / 2, color: EXTRATO_PDF.brand });
  page.drawText('IH', {
    x: x + size * 0.24,
    y: centerY - 5,
    size: 12,
    font: fontBold,
    color: EXTRATO_PDF.white,
  });
}

function drawMonthPill(state: PageState, label: string) {
  const pillHeight = 18;
  const pillWidth = Math.min(state.fontBold.widthOfTextAtSize(label, 9) + 20, contentWidth());
  drawAccentCapsule(state.page, contentX(), state.y - pillHeight, pillWidth, pillHeight, EXTRATO_PDF.successSoft);
  state.page.drawText(label, {
    x: contentX() + 10,
    y: state.y - pillHeight + 5,
    size: 9,
    font: state.fontBold,
    color: EXTRATO_PDF.statusPaid,
  });
}

function drawTableHeader(state: PageState) {
  const { page, fontBold } = state;
  const y = state.y;
  const headerHeight = 20;
  const x = contentX();
  const width = contentWidth();
  drawAccentCapsule(page, x, y - headerHeight, width, headerHeight, EXTRATO_PDF.primary);

  page.drawText('Data', { x: x + 10, y: y - 14, size: 8.5, font: fontBold, color: EXTRATO_PDF.white });
  page.drawText('Descrição', { x: x + 86, y: y - 14, size: 8.5, font: fontBold, color: EXTRATO_PDF.white });
  const amountLabel = 'Valor';
  const amountWidth = fontBold.widthOfTextAtSize(amountLabel, 8.5);
  page.drawText(amountLabel, {
    x: x + width - amountWidth - 10,
    y: y - 14,
    size: 8.5,
    font: fontBold,
    color: EXTRATO_PDF.white,
  });
}

function drawLedgerRow(state: PageState, line: LedgerLine, alternate: boolean) {
  const { page, font, fontBold } = state;
  const y = state.y;
  const rowHeight = 20;
  const x = contentX();
  const width = contentWidth();

  drawRoundedRect(
    page,
    x,
    y - rowHeight + 2,
    width,
    rowHeight,
    EXTRATO_PDF.rowRadius,
    alternate ? EXTRATO_PDF.rowAlt : EXTRATO_PDF.white,
  );

  page.drawText(formatCalendarDateBr(line.date), {
    x: x + 10,
    y: y - 14,
    size: 9,
    font,
    color: EXTRATO_PDF.muted,
  });

  const amountReserve = 88;
  const label = truncateLabel(line.label, font, 9, width - 96 - amountReserve);
  page.drawText(label, {
    x: x + 86,
    y: y - 14,
    size: 9,
    font,
    color: EXTRATO_PDF.text,
  });

  const isOut = line.direction === LedgerDirection.Out;
  const amountText = `${isOut ? '-' : '+'}${formatCentsAsBrl(line.amountCents)}`;
  const amountWidth = fontBold.widthOfTextAtSize(amountText, 9.5);
  const pillPadding = 8;
  const pillWidth = amountWidth + pillPadding * 2;
  const pillHeight = 14;
  const pillX = x + width - pillWidth - 6;
  const pillY = y - rowHeight + 4;
  drawAccentCapsule(
    page,
    pillX,
    pillY,
    pillWidth,
    pillHeight,
    isOut ? EXTRATO_PDF.dangerSoft : EXTRATO_PDF.successSoft,
  );
  page.drawText(amountText, {
    x: pillX + pillPadding,
    y: pillY + 3,
    size: 9.5,
    font: fontBold,
    color: isOut ? EXTRATO_PDF.danger : EXTRATO_PDF.statusPaid,
  });
}

function drawEmptyState(state: PageState) {
  const width = EXTRATO_PDF.pageWidth - EXTRATO_PDF.margin * 2;
  const height = 52;
  const y = state.y - height;
  drawRoundedRectBorder(
    state.page,
    EXTRATO_PDF.margin,
    y,
    width,
    height,
    EXTRATO_PDF.contentRadius,
    EXTRATO_PDF.white,
    EXTRATO_PDF.border,
    1,
  );
  state.page.drawText('Nenhum lançamento no período.', {
    x: contentX(),
    y: y + height / 2 - 4,
    size: 11,
    font: state.font,
    color: EXTRATO_PDF.muted,
  });
  state.y = y - 8;
}

function drawFooter(page: PDFPage, font: PDFFont) {
  page.drawText('In House Bank · extrato para conferência (não movimenta dinheiro real)', {
    x: EXTRATO_PDF.margin,
    y: EXTRATO_PDF.margin - 8,
    size: 8,
    font,
    color: EXTRATO_PDF.muted,
  });
}

function truncateLabel(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) {
    return text;
  }
  let trimmed = text;
  while (trimmed.length > 3 && font.widthOfTextAtSize(`${trimmed}…`, size) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}…`;
}
