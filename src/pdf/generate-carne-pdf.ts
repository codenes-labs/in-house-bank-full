import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';
import {
  CARNE_INSTALLMENTS_PER_PAGE,
  CARNE_PDF_COLORS,
  CARNE_PDF_HEADER_BLOCK_HEIGHT_PT,
  CARNE_PDF_PAGE_HEIGHT_PT,
  CARNE_PDF_PAGE_MARGIN_PT,
  CARNE_PDF_PAGE_WIDTH_PT,
  CARNE_PDF_ROW_GAP_PT,
  chunkInstallmentsByPage,
  computeCarneInstallmentRowHeightPt,
} from '../domain/pdf/carne-pdf-layout';
import { buildCarneHeaderSummary } from '../domain/pdf/build-carne-header-summary';
import { formatCalendarDateBr } from '../domain/pdf/format-calendar-date-br';
import { formatCentsAsBrl } from '../domain/money/brl-input';
import type { Installment } from '../domain/models/installment';
import type { InstallmentPlan } from '../domain/models/installment-plan';
import type { Settings } from '../domain/models/settings';
import { resolveCarneFooterText } from '../domain/pdf/resolve-carne-footer-text';
import { buildStaticPixBrCode } from '../domain/pix/build-static-pix-br-code';
import { normalizePixText } from '../domain/pix/normalize-pix-text';

const PAGE_MARGIN = CARNE_PDF_PAGE_MARGIN_PT;
const HEADER_BLOCK_HEIGHT = CARNE_PDF_HEADER_BLOCK_HEIGHT_PT;
const ROW_GAP = CARNE_PDF_ROW_GAP_PT;
const ROW_HEADER_HEIGHT = 22;
const STUB_WIDTH_RATIO = 437 / (437 + 763);

export interface CarnePdfInput {
  plan: InstallmentPlan;
  installments: Installment[];
  settings: Settings;
}

export async function generateCarnePdf(input: CarnePdfInput): Promise<Uint8Array> {
  const sortedInstallments = [...input.installments].sort(
    (left, right) => left.number - right.number,
  );
  const installmentPages = chunkInstallmentsByPage(sortedInstallments, CARNE_INSTALLMENTS_PER_PAGE);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontPix = await pdfDoc.embedFont(StandardFonts.Courier);

  const cardWidth = CARNE_PDF_PAGE_WIDTH_PT - PAGE_MARGIN * 2;
  const stubWidth = Math.round(cardWidth * STUB_WIDTH_RATIO);
  const logo = await embedLogo(pdfDoc, input.settings.logoDataUrl);

  for (const pageInstallments of installmentPages) {
    const page = pdfDoc.addPage([CARNE_PDF_PAGE_WIDTH_PT, CARNE_PDF_PAGE_HEIGHT_PT]);
    drawPageHeader(page, input.plan, sortedInstallments, fontBold, font, logo);
    const rowHeight = computeCarneInstallmentRowHeightPt();
    for (let index = 0; index < pageInstallments.length; index++) {
      await drawInstallmentRow(
        page,
        input,
        pageInstallments[index],
        index,
        rowHeight,
        stubWidth,
        font,
        fontBold,
        fontPix,
      );
    }
    drawPageFooter(page, input.plan, input.settings, font);
  }

  return pdfDoc.save();
}

function drawPageHeader(
  page: PDFPage,
  plan: InstallmentPlan,
  installments: Installment[],
  fontBold: PDFFont,
  font: PDFFont,
  logo: PDFImage | null,
): void {
  const { width, height } = page.getSize();
  const titleY = height - PAGE_MARGIN - 14;

  page.drawText('In House Bank', {
    x: PAGE_MARGIN,
    y: titleY,
    size: 18,
    font: fontBold,
    color: hex(CARNE_PDF_COLORS.primary600),
  });

  if (logo) {
    const logoSize = 28;
    page.drawImage(logo, {
      x: width - PAGE_MARGIN - logoSize,
      y: titleY - 6,
      width: logoSize,
      height: logoSize,
    });
  }

  const summary = buildCarneHeaderSummary(plan, installments);
  const summaryY = titleY - 20;
  page.drawText(summary, {
    x: PAGE_MARGIN,
    y: summaryY,
    size: 8,
    font,
    color: hex(CARNE_PDF_COLORS.label),
    maxWidth: width - PAGE_MARGIN * 2,
  });

  drawRoundedRect(page, PAGE_MARGIN, summaryY - 10, 42, 3, 1.5, hex(CARNE_PDF_COLORS.accent));
}

async function drawInstallmentRow(
  page: PDFPage,
  input: CarnePdfInput,
  installment: Installment,
  rowIndex: number,
  rowHeight: number,
  stubWidth: number,
  font: PDFFont,
  fontBold: PDFFont,
  fontPix: PDFFont,
): Promise<void> {
  const { width, height } = page.getSize();
  const contentTop = height - PAGE_MARGIN - HEADER_BLOCK_HEIGHT;
  const rowTop = contentTop - rowIndex * (rowHeight + ROW_GAP);
  const rowBottom = rowTop - rowHeight;
  const cardX = PAGE_MARGIN;
  const cardWidth = width - PAGE_MARGIN * 2;
  const stubDividerX = cardX + stubWidth;
  const mainX = stubDividerX;
  const mainWidth = cardWidth - stubWidth;

  const cardRadius = 12;
  drawRoundedRect(page, cardX + 1.5, rowBottom - 2, cardWidth, rowHeight, cardRadius, hex('#E2E8F0'));
  drawRoundedRect(page, cardX, rowBottom, cardWidth, rowHeight, cardRadius, hex(CARNE_PDF_COLORS.white));
  drawRoundedRect(
    page,
    cardX + 7,
    rowBottom + 7,
    stubWidth - 16,
    rowHeight - 14,
    9,
    hex(CARNE_PDF_COLORS.primary50),
  );

  page.drawLine({
    start: { x: stubDividerX, y: rowBottom + 16 },
    end: { x: stubDividerX, y: rowTop - 16 },
    thickness: 0.8,
    color: hex(CARNE_PDF_COLORS.stubDivider),
    dashArray: [1.2, 3.2],
  });

  drawStubHeader(page, input.plan, installment, cardX, stubWidth, rowTop, fontBold);
  drawMainHeader(page, installment, input.plan, mainX, mainWidth, rowTop, font, fontBold);

  drawStubBody(page, input.plan, installment, cardX, stubWidth, rowBottom, rowTop, font, fontBold);
  await drawMainBody(
    page,
    input,
    installment,
    mainX,
    mainWidth,
    rowBottom,
    rowTop,
    font,
    fontBold,
    fontPix,
  );
}

function drawStubHeader(
  page: PDFPage,
  plan: InstallmentPlan,
  installment: Installment,
  cardX: number,
  stubWidth: number,
  rowTop: number,
  fontBold: PDFFont,
): void {
  const headerBottom = rowTop - ROW_HEADER_HEIGHT;

  page.drawText('Canhoto', {
    x: cardX + 16,
    y: headerBottom + 8,
    size: 8,
    font: fontBold,
    color: hex(CARNE_PDF_COLORS.primary700),
  });

  const parcelaLabel = `${installment.number}/${plan.installmentsCount}`;
  const parcelaWidth = fontBold.widthOfTextAtSize(parcelaLabel, 8);
  page.drawText(parcelaLabel, {
    x: cardX + stubWidth - parcelaWidth - 18,
    y: headerBottom + 8,
    size: 8,
    font: fontBold,
    color: hex(CARNE_PDF_COLORS.accent),
  });
}

function drawMainHeader(
  page: PDFPage,
  installment: Installment,
  plan: InstallmentPlan,
  mainX: number,
  mainWidth: number,
  rowTop: number,
  font: PDFFont,
  fontBold: PDFFont,
): void {
  const headerBottom = rowTop - ROW_HEADER_HEIGHT;

  page.drawText('In House Bank', {
    x: mainX + 12,
    y: headerBottom + 7,
    size: 10,
    font: fontBold,
    color: hex(CARNE_PDF_COLORS.primary700),
  });
  page.drawText('Pague com Pix', {
    x: mainX + 18 + fontBold.widthOfTextAtSize('In House Bank', 10),
    y: headerBottom + 8,
    size: 8,
    font,
    color: hex(CARNE_PDF_COLORS.label),
  });

  const pillLabel = `Parcela ${installment.number}/${plan.installmentsCount}`;
  const pillSize = 7.5;
  const pillWidth = fontBold.widthOfTextAtSize(pillLabel, pillSize) + 16;
  const pillHeight = 14;
  const pillX = mainX + mainWidth - pillWidth - 12;
  const pillY = headerBottom + 4;
  drawRoundedRect(page, pillX, pillY, pillWidth, pillHeight, 7, hex(CARNE_PDF_COLORS.primary50));
  page.drawText(pillLabel, {
    x: pillX + 8,
    y: pillY + 3.5,
    size: pillSize,
    font: fontBold,
    color: hex(CARNE_PDF_COLORS.primary600),
  });
}

function drawStubBody(
  page: PDFPage,
  plan: InstallmentPlan,
  installment: Installment,
  cardX: number,
  stubWidth: number,
  rowBottom: number,
  rowTop: number,
  font: PDFFont,
  fontBold: PDFFont,
): void {
  const textX = cardX + 16;
  const maxWidth = stubWidth - 34;
  const bodyBottom = rowBottom + 8;
  const paymentLine = installment.paidDate
    ? formatCalendarDateBr(installment.paidDate)
    : '____/____/______';

  const fields = [
    { label: 'Vencimento', value: formatCalendarDateBr(installment.dueDate) },
    { label: 'Valor', value: `R$ ${formatCentsAsBrl(installment.amountCents)}` },
    { label: 'Data da compra', value: formatCalendarDateBr(plan.issueDate) },
    { label: 'Beneficiário', value: plan.beneficiary },
    { label: 'Pagador', value: plan.borrowerName },
  ];

  const paymentBlockHeight = 12;
  const fieldBlockHeight = 17;
  const fieldGap = 4;
  const fieldsHeight =
    fields.length * fieldBlockHeight + (fields.length - 1) * fieldGap + paymentBlockHeight + 10;
  const bodyTop = rowTop - ROW_HEADER_HEIGHT - 8;
  let y = bodyTop - (bodyTop - bodyBottom - fieldsHeight) / 2;

  for (const field of fields) {
    drawLabelValue(page, textX, y, field.label, field.value, font, fontBold, maxWidth, 6, 8);
    y -= fieldBlockHeight + fieldGap;
  }

  page.drawText(`Pagamento: ${paymentLine}`, {
    x: textX,
    y: Math.max(bodyBottom + 2, y),
    size: 6.5,
    font,
    color: hex(CARNE_PDF_COLORS.label),
    maxWidth,
  });
}

async function drawMainBody(
  page: PDFPage,
  input: CarnePdfInput,
  installment: Installment,
  mainX: number,
  mainWidth: number,
  rowBottom: number,
  rowTop: number,
  font: PDFFont,
  fontBold: PDFFont,
  fontPix: PDFFont,
): Promise<void> {
  const paddingX = 12;
  const bodyTop = rowTop - ROW_HEADER_HEIGHT - 4;
  const bodyBottom = rowBottom + 12;
  const qrColumnWidth = 92;
  const leftColX = mainX + paddingX;
  const leftColWidth = mainWidth - paddingX * 2 - qrColumnWidth;
  const qrSize = Math.min(72, bodyTop - bodyBottom - 22);

  const brCode = buildStaticPixBrCode({
    pixKey: input.plan.pixKey,
    amountCents: installment.amountCents,
    merchantName: normalizePixText(input.plan.beneficiary, 25),
    merchantCity: normalizePixText(input.settings.city, 15).toUpperCase(),
    txid: installment.txid,
  });

  const pixCodeSize = 4.2;
  const pixLines = wrapText(brCode, fontPix, pixCodeSize, leftColWidth).slice(0, 3);
  const pixLineHeight = 6;
  const pixBlockHeight = pixLines.length * pixLineHeight;
  const pixHeaderHeight = 9;
  const valueBoxHeight = 26;

  const pixCodeBottom = bodyBottom;
  pixLines.forEach((line, index) => {
    page.drawText(line, {
      x: leftColX,
      y: pixCodeBottom + (pixLines.length - 1 - index) * pixLineHeight,
      size: pixCodeSize,
      font: fontPix,
      color: hex(CARNE_PDF_COLORS.pixCode),
    });
  });

  const pixHeaderY = pixCodeBottom + pixBlockHeight + 2;
  page.drawText('Pix copia e cola', {
    x: leftColX,
    y: pixHeaderY,
    size: 6.5,
    font,
    color: hex(CARNE_PDF_COLORS.label),
    maxWidth: leftColWidth,
  });

  const valorBoxY = pixHeaderY + pixHeaderHeight + 4;
  drawValorDocumentoBox(page, leftColX, valorBoxY, installment.amountCents, font, fontBold);

  const fieldsBottomLimit = valorBoxY + valueBoxHeight + 6;
  let y = bodyTop;
  const fieldRowHeight = 22;

  const beneficiaryRowY = y;
  drawLabelValue(
    page,
    leftColX,
    beneficiaryRowY,
    'Beneficiário',
    input.plan.beneficiary,
    font,
    fontBold,
    leftColWidth / 2 - 6,
    6,
    8,
  );
  drawLabelValue(
    page,
    leftColX + leftColWidth / 2 + 6,
    beneficiaryRowY,
    'Instituição',
    input.plan.institution,
    font,
    fontBold,
    leftColWidth / 2 - 6,
    6,
    8,
  );
  y -= fieldRowHeight;

  if (y - 16 > fieldsBottomLimit) {
    drawLabelValue(
      page,
      leftColX,
      y,
      'Referente a',
      input.plan.reference,
      font,
      fontBold,
      leftColWidth,
      6,
      8,
    );
    y -= fieldRowHeight;
  }

  if (y - 16 > fieldsBottomLimit) {
    const datesRowY = y;
    drawLabelValue(
      page,
      leftColX,
      datesRowY,
      'Data da compra',
      formatCalendarDateBr(input.plan.issueDate),
      font,
      fontBold,
      leftColWidth / 2 - 6,
      6,
      8,
    );
    drawLabelValue(
      page,
      leftColX + leftColWidth / 2 + 6,
      datesRowY,
      'Vencimento',
      formatCalendarDateBr(installment.dueDate),
      font,
      fontBold,
      leftColWidth / 2 - 6,
      6,
      8,
    );
  }

  const qrDataUrl = await QRCode.toDataURL(brCode, { margin: 0, width: 220 });
  const qrBase64 = qrDataUrl.split(',')[1] ?? '';
  const qrBytes = Uint8Array.from(atob(qrBase64), (char) => char.charCodeAt(0));
  const qrImage = await page.doc.embedPng(qrBytes);
  const qrPad = 6;
  const frameSize = qrSize + qrPad * 2;
  const frameX = mainX + mainWidth - paddingX - frameSize;
  const frameY = bodyBottom + (bodyTop - bodyBottom - frameSize - 10) / 2;
  drawRoundedRect(page, frameX, frameY, frameSize, frameSize, 8, hex(CARNE_PDF_COLORS.primary50));
  const qrX = frameX + qrPad;
  const qrY = frameY + qrPad;
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  const scanCaption = 'Escaneie no app do banco';
  const scanWidth = font.widthOfTextAtSize(scanCaption, 6);
  page.drawText(scanCaption, {
    x: frameX + (frameSize - scanWidth) / 2,
    y: frameY - 10,
    size: 6,
    font,
    color: hex(CARNE_PDF_COLORS.label),
  });
}

function drawValorDocumentoBox(
  page: PDFPage,
  x: number,
  y: number,
  amountCents: number,
  font: PDFFont,
  fontBold: PDFFont,
): void {
  const label = 'Valor';
  const amountText = `R$ ${formatCentsAsBrl(amountCents)}`;
  const labelSize = 7;
  const amountSize = 13;
  const labelWidth = font.widthOfTextAtSize(label, labelSize);
  const amountWidth = fontBold.widthOfTextAtSize(amountText, amountSize);
  const boxWidth = labelWidth + amountWidth + 28;
  const boxHeight = 24;

  drawRoundedRect(page, x, y, boxWidth, boxHeight, 8, hex(CARNE_PDF_COLORS.valueBoxBg));

  page.drawText(label, {
    x: x + 10,
    y: y + 8,
    size: labelSize,
    font,
    color: hex(CARNE_PDF_COLORS.accent),
  });
  page.drawText(amountText, {
    x: x + labelWidth + 18,
    y: y + 6,
    size: amountSize,
    font: fontBold,
    color: hex(CARNE_PDF_COLORS.accent),
  });
}

function drawLabelValue(
  page: PDFPage,
  x: number,
  y: number,
  label: string,
  value: string,
  font: PDFFont,
  fontBold: PDFFont,
  maxWidth: number,
  labelSize: number,
  valueSize: number,
): void {
  page.drawText(label, {
    x,
    y,
    size: labelSize,
    font,
    color: hex(CARNE_PDF_COLORS.label),
    maxWidth,
  });
  page.drawText(value, {
    x,
    y: y - valueSize - 1,
    size: valueSize,
    font: fontBold,
    color: hex(CARNE_PDF_COLORS.text),
    maxWidth,
  });
}

function drawPageFooter(page: PDFPage, plan: InstallmentPlan, settings: Settings, font: PDFFont): void {
  const footerText = resolveCarneFooterText(plan, settings);
  page.drawText(footerText, {
    x: PAGE_MARGIN,
    y: PAGE_MARGIN - 2,
    size: 6.5,
    font,
    color: hex(CARNE_PDF_COLORS.muted),
    maxWidth: CARNE_PDF_PAGE_WIDTH_PT - PAGE_MARGIN * 2,
  });
}

async function embedLogo(pdfDoc: PDFDocument, logoDataUrl?: string): Promise<PDFImage | null> {
  if (!logoDataUrl?.startsWith('data:image/')) {
    return null;
  }
  const [meta, base64] = logoDataUrl.split(',');
  if (!meta || !base64) {
    return null;
  }
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  if (meta.includes('png')) {
    return pdfDoc.embedPng(bytes);
  }
  if (meta.includes('jpeg') || meta.includes('jpg')) {
    return pdfDoc.embedJpg(bytes);
  }
  return null;
}

function hex(value: string) {
  const normalized = value.replace('#', '');
  const numeric = Number.parseInt(normalized, 16);
  return rgb(((numeric >> 16) & 255) / 255, ((numeric >> 8) & 255) / 255, (numeric & 255) / 255);
}

function drawRoundedRect(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: ReturnType<typeof rgb>,
): void {
  const corner = Math.min(radius, width / 2, height / 2);
  page.drawRectangle({ x: x + corner, y, width: width - corner * 2, height, color });
  page.drawRectangle({ x, y: y + corner, width, height: height - corner * 2, color });
  page.drawEllipse({ x: x + corner, y: y + corner, xScale: corner, yScale: corner, color });
  page.drawEllipse({ x: x + width - corner, y: y + corner, xScale: corner, yScale: corner, color });
  page.drawEllipse({ x: x + corner, y: y + height - corner, xScale: corner, yScale: corner, color });
  page.drawEllipse({ x: x + width - corner, y: y + height - corner, xScale: corner, yScale: corner, color });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const char of text) {
    const next = current + char;
    if (current && font.widthOfTextAtSize(next, size) > maxWidth) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}
