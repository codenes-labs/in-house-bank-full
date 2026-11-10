import { PDFDocument, StandardFonts, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';
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
import { embedDataUrlImage } from './embed-data-url-image';
import {
  CARNE_FIELD,
  drawFieldBlock,
  drawFieldBlockWrapped,
  fieldBlockStride,
  singleLineContentHeight,
} from './carne-pdf-fields';
import { drawAccentCapsule, drawRoundedRect, drawRoundedRectBorder, pdfHex } from './pdf-draw';
import { balanceMonospaceLines, limitPdfLines, wrapPdfText, wrapPdfTextByChar } from './wrap-pdf-text';

const PAGE_MARGIN = CARNE_PDF_PAGE_MARGIN_PT;
const HEADER_BLOCK_HEIGHT = CARNE_PDF_HEADER_BLOCK_HEIGHT_PT;
const ROW_GAP = CARNE_PDF_ROW_GAP_PT;
const ROW_HEADER_HEIGHT = 22;
const STUB_WIDTH_RATIO = 0.41;
const HEADER_BAR_HEIGHT = 46;
const CARD_RADIUS = 16;
const PIX_CODE_SIZE = 5.8;
const PIX_CODE_LINE_HEIGHT = 7.5;
const PIX_CODE_MAX_LINES = 4;

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
  const logo = await embedDataUrlImage(pdfDoc, input.settings.logoDataUrl);

  for (const pageInstallments of installmentPages) {
    const page = pdfDoc.addPage([CARNE_PDF_PAGE_WIDTH_PT, CARNE_PDF_PAGE_HEIGHT_PT]);
    drawPageHeader(page, input, sortedInstallments, fontBold, font, logo);
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
  input: CarnePdfInput,
  installments: Installment[],
  fontBold: PDFFont,
  font: PDFFont,
  logo: PDFImage | null,
): void {
  const { width, height } = page.getSize();
  const barHeight = HEADER_BAR_HEIGHT;
  const barY = height - PAGE_MARGIN - barHeight;
  const barWidth = width - PAGE_MARGIN * 2;
  const brand = input.settings.businessName?.trim() || 'In House Bank';
  const logoSize = logo ? 30 : 0;
  const summaryMaxWidth = barWidth - 32 - (logoSize > 0 ? logoSize + 16 : 0);

  drawRoundedRect(page, PAGE_MARGIN + 1.5, barY - 1.5, barWidth, barHeight, CARD_RADIUS, hex(CARNE_PDF_COLORS.cardShadow));
  drawRoundedRect(page, PAGE_MARGIN, barY, barWidth, barHeight, CARD_RADIUS, hex(CARNE_PDF_COLORS.headerBar));

  const textX = PAGE_MARGIN + 16;
  page.drawText(brand, {
    x: textX,
    y: barY + barHeight - 18,
    size: 13,
    font: fontBold,
    color: hex(CARNE_PDF_COLORS.white),
  });

  const summary = buildCarneHeaderSummary(input.plan, installments);
  const summaryLines = limitPdfLines(wrapPdfText(summary, font, 6.5, summaryMaxWidth), 2);
  let summaryY = barY + barHeight - 32;
  for (const line of summaryLines) {
    page.drawText(line, {
      x: textX,
      y: summaryY,
      size: 6.5,
      font,
      color: hex(CARNE_PDF_COLORS.headerSubtext),
      maxWidth: summaryMaxWidth,
    });
    summaryY -= 8;
  }

  if (logo) {
    page.drawImage(logo, {
      x: PAGE_MARGIN + barWidth - logoSize - 14,
      y: barY + (barHeight - logoSize) / 2,
      width: logoSize,
      height: logoSize,
    });
  }
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

  drawRoundedRect(
    page,
    cardX + 1.5,
    rowBottom - 1.5,
    cardWidth,
    rowHeight,
    CARD_RADIUS,
    hex(CARNE_PDF_COLORS.cardShadow),
  );
  drawRoundedRectBorder(
    page,
    cardX,
    rowBottom,
    cardWidth,
    rowHeight,
    CARD_RADIUS,
    hex(CARNE_PDF_COLORS.white),
    hex(CARNE_PDF_COLORS.border),
    1,
  );
  drawRoundedRect(
    page,
    cardX + 8,
    rowBottom + 8,
    stubWidth - 18,
    rowHeight - 16,
    12,
    hex(CARNE_PDF_COLORS.stubBg),
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
    color: hex(CARNE_PDF_COLORS.primary700),
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
  drawAccentCapsule(page, pillX, pillY, pillWidth, pillHeight, hex(CARNE_PDF_COLORS.primary700));
  page.drawText(pillLabel, {
    x: pillX + 8,
    y: pillY + 3.5,
    size: pillSize,
    font: fontBold,
    color: hex(CARNE_PDF_COLORS.white),
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
  const paymentY = rowBottom + 20;
  const paymentLine = installment.paidDate
    ? formatCalendarDateBr(installment.paidDate)
    : '____/____/______';

  const fields: { label: string; value: string; wrap?: boolean }[] = [
    { label: 'Vencimento', value: formatCalendarDateBr(installment.dueDate) },
    { label: 'Valor', value: `R$ ${formatCentsAsBrl(installment.amountCents)}` },
    { label: 'Data da compra', value: formatCalendarDateBr(plan.issueDate) },
    { label: 'Beneficiário', value: plan.beneficiary, wrap: true },
    { label: 'Pagador', value: plan.borrowerName },
  ];

  const labelColor = hex(CARNE_PDF_COLORS.label);
  const valueColor = hex(CARNE_PDF_COLORS.text);
  const bodyTop = rowTop - ROW_HEADER_HEIGHT - 10;
  let y = bodyTop;

  for (const field of fields) {
    const blockHeight = field.wrap
      ? drawFieldBlockWrapped(
          page,
          textX,
          y,
          field.label,
          field.value,
          font,
          fontBold,
          maxWidth,
          labelColor,
          valueColor,
          2,
        )
      : drawFieldBlock(page, textX, y, field.label, field.value, font, fontBold, maxWidth, labelColor, valueColor);
    y -= fieldBlockStride(blockHeight);
    if (y < paymentY + 12) {
      break;
    }
  }

  page.drawText(`Pagamento: ${paymentLine}`, {
    x: textX,
    y: paymentY,
    size: CARNE_FIELD.labelSize,
    font,
    color: labelColor,
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
  const bodyTop = rowTop - ROW_HEADER_HEIGHT - 8;
  const contentBottom = rowBottom + 14;
  const qrColumnWidth = 92;
  const leftColX = mainX + paddingX;
  const leftColWidth = mainWidth - paddingX * 2 - qrColumnWidth;
  const qrSize = Math.min(72, bodyTop - contentBottom - 22);
  const colGap = 12;
  const colWidth = (leftColWidth - colGap) / 2;
  const rightColX = leftColX + colWidth + colGap;
  const labelColor = hex(CARNE_PDF_COLORS.label);
  const valueColor = hex(CARNE_PDF_COLORS.text);

  const brCode = buildStaticPixBrCode({
    pixKey: input.plan.pixKey,
    amountCents: installment.amountCents,
    merchantName: normalizePixText(input.plan.beneficiary, 25),
    merchantCity: normalizePixText(input.settings.city, 15).toUpperCase(),
    txid: installment.txid,
  });

  const pixInnerWidth = leftColWidth - 12;
  const pixLines = limitPdfLines(
    balanceMonospaceLines(
      wrapPdfTextByChar(brCode, fontPix, PIX_CODE_SIZE, pixInnerWidth),
      fontPix,
      PIX_CODE_SIZE,
      pixInnerWidth,
    ),
    PIX_CODE_MAX_LINES,
  );
  const pixBoxPad = 6;
  const pixLabelHeight = 8;
  const pixBoxHeight = pixBoxPad * 2 + pixLabelHeight + pixLines.length * PIX_CODE_LINE_HEIGHT;
  const valorBoxHeight = 30;
  const valorGap = 8;
  const stackHeight = pixBoxHeight + valorGap + valorBoxHeight + 6;
  const fieldsAreaBottom = contentBottom + stackHeight;

  const pixBoxY = contentBottom;
  const valorBoxY = pixBoxY + pixBoxHeight + valorGap;
  drawValorDocumentoBox(page, leftColX, valorBoxY, leftColWidth, installment.amountCents, font, fontBold);
  drawPixCodeBox(page, leftColX, pixBoxY, leftColWidth, pixBoxHeight, pixLines, font, fontPix);

  let y = bodyTop;
  const pairContent = singleLineContentHeight();
  drawFieldBlock(
    page,
    leftColX,
    y,
    'Beneficiário',
    input.plan.beneficiary,
    font,
    fontBold,
    colWidth,
    labelColor,
    valueColor,
  );
  drawFieldBlock(
    page,
    rightColX,
    y,
    'Instituição',
    input.plan.institution,
    font,
    fontBold,
    colWidth,
    labelColor,
    valueColor,
  );
  y -= fieldBlockStride(pairContent);

  const referenteHeight = drawFieldBlockWrapped(
    page,
    leftColX,
    y,
    'Referente a',
    input.plan.reference,
    font,
    fontBold,
    leftColWidth,
    labelColor,
    valueColor,
    CARNE_FIELD.referenteMaxLines,
  );
  y -= fieldBlockStride(referenteHeight);

  if (y - pairContent >= fieldsAreaBottom) {
    drawFieldBlock(page, leftColX, y, 'Pagador', input.plan.borrowerName, font, fontBold, colWidth, labelColor, valueColor);
    drawFieldBlock(
      page,
      rightColX,
      y,
      'Vencimento',
      formatCalendarDateBr(installment.dueDate),
      font,
      fontBold,
      colWidth,
      labelColor,
      valueColor,
    );
    y -= fieldBlockStride(pairContent);
  }

  if (y - pairContent >= fieldsAreaBottom) {
    drawFieldBlock(
      page,
      leftColX,
      y,
      'Data da compra',
      formatCalendarDateBr(input.plan.issueDate),
      font,
      fontBold,
      colWidth,
      labelColor,
      valueColor,
    );
  }

  const qrDataUrl = await QRCode.toDataURL(brCode, { margin: 0, width: 220 });
  const qrBase64 = qrDataUrl.split(',')[1] ?? '';
  const qrBytes = Uint8Array.from(atob(qrBase64), (char) => char.charCodeAt(0));
  const qrImage = await page.doc.embedPng(qrBytes);
  const qrPad = 6;
  const frameSize = qrSize + qrPad * 2;
  const frameX = mainX + mainWidth - paddingX - frameSize;
  const frameY = contentBottom + (bodyTop - contentBottom - frameSize - 10) / 2;
  drawRoundedRectBorder(
    page,
    frameX,
    frameY,
    frameSize,
    frameSize,
    10,
    hex(CARNE_PDF_COLORS.white),
    hex(CARNE_PDF_COLORS.border),
    1,
  );
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

function drawPixCodeBox(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  lines: string[],
  font: PDFFont,
  fontPix: PDFFont,
): void {
  drawRoundedRectBorder(
    page,
    x,
    y,
    width,
    height,
    10,
    hex(CARNE_PDF_COLORS.pixBoxBg),
    hex(CARNE_PDF_COLORS.border),
    1,
  );

  const innerX = x + 8;
  let textY = y + height - 10;
  page.drawText('Pix copia e cola', {
    x: innerX,
    y: textY,
    size: CARNE_FIELD.labelSize,
    font,
    color: hex(CARNE_PDF_COLORS.label),
    maxWidth: width - 16,
  });
  textY -= PIX_CODE_LINE_HEIGHT;
  for (const line of lines) {
    page.drawText(line, {
      x: innerX,
      y: textY - PIX_CODE_SIZE,
      size: PIX_CODE_SIZE,
      font: fontPix,
      color: hex(CARNE_PDF_COLORS.pixCode),
    });
    textY -= PIX_CODE_LINE_HEIGHT;
  }
}

function drawValorDocumentoBox(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  amountCents: number,
  font: PDFFont,
  fontBold: PDFFont,
): void {
  const label = 'Valor';
  const amountText = `R$ ${formatCentsAsBrl(amountCents)}`;
  const labelSize = 7;
  const amountSize = 15;
  const boxHeight = 30;

  drawRoundedRect(page, x, y, width, boxHeight, boxHeight / 2, hex(CARNE_PDF_COLORS.valueBoxBg));

  page.drawText(label, {
    x: x + 16,
    y: y + 11,
    size: labelSize,
    font,
    color: hex(CARNE_PDF_COLORS.valueBoxLabel),
  });

  const amountWidth = fontBold.widthOfTextAtSize(amountText, amountSize);
  page.drawText(amountText, {
    x: x + width - amountWidth - 16,
    y: y + 9,
    size: amountSize,
    font: fontBold,
    color: hex(CARNE_PDF_COLORS.valueBoxAmount),
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

function hex(value: string) {
  return pdfHex(value);
}

