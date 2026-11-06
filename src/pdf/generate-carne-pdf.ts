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
import { fitSingleLineFontSize } from '../domain/pdf/fit-single-line-font-size';
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

  page.drawText('CARNÊPIX', {
    x: PAGE_MARGIN,
    y: titleY,
    size: 20,
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

  const lineY = summaryY - 8;
  page.drawLine({
    start: { x: PAGE_MARGIN, y: lineY },
    end: { x: width - PAGE_MARGIN, y: lineY },
    thickness: 2,
    color: hex(CARNE_PDF_COLORS.primary600),
  });
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

  page.drawRectangle({
    x: cardX,
    y: rowBottom,
    width: cardWidth,
    height: rowHeight,
    borderColor: hex(CARNE_PDF_COLORS.border),
    borderWidth: 1,
    color: hex(CARNE_PDF_COLORS.white),
  });

  page.drawRectangle({
    x: cardX,
    y: rowBottom,
    width: stubWidth,
    height: rowHeight,
    color: hex(CARNE_PDF_COLORS.primary50),
  });

  page.drawLine({
    start: { x: stubDividerX, y: rowBottom },
    end: { x: stubDividerX, y: rowTop },
    thickness: 0.8,
    color: hex(CARNE_PDF_COLORS.stubDivider),
    dashArray: [4, 3],
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

  page.drawLine({
    start: { x: cardX, y: rowBottom },
    end: { x: cardX + cardWidth, y: rowBottom },
    thickness: 0.5,
    color: hex(CARNE_PDF_COLORS.muted),
    dashArray: [3, 2],
  });
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

  page.drawRectangle({
    x: cardX,
    y: headerBottom,
    width: stubWidth,
    height: ROW_HEADER_HEIGHT,
    color: hex(CARNE_PDF_COLORS.primary50),
  });

  page.drawText('CANHOTO', {
    x: cardX + 10,
    y: headerBottom + 7,
    size: 8,
    font: fontBold,
    color: hex(CARNE_PDF_COLORS.primary700),
  });

  const parcelaLabel = `Parcela ${installment.number}/${plan.installmentsCount}`;
  const parcelaWidth = fontBold.widthOfTextAtSize(parcelaLabel, 8);
  page.drawText(parcelaLabel, {
    x: cardX + stubWidth - parcelaWidth - 10,
    y: headerBottom + 7,
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

  page.drawRectangle({
    x: mainX,
    y: headerBottom,
    width: mainWidth,
    height: ROW_HEADER_HEIGHT,
    color: hex(CARNE_PDF_COLORS.primary700),
  });

  page.drawText('CARNÊPIX', {
    x: mainX + 10,
    y: headerBottom + 5,
    size: 11,
    font: fontBold,
    color: hex(CARNE_PDF_COLORS.white),
  });

  const rightLabel = `Parcela ${installment.number}/${plan.installmentsCount}  |  Pague com Pix`;
  const rightWidth = font.widthOfTextAtSize(rightLabel, 7);
  page.drawText(rightLabel, {
    x: mainX + mainWidth - rightWidth - 10,
    y: headerBottom + 7,
    size: 7,
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
  const textX = cardX + 10;
  const maxWidth = stubWidth - 18;
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
  const paddingX = 10;
  const bodyTop = rowTop - ROW_HEADER_HEIGHT - 6;
  const bodyBottom = rowBottom + 6;
  const qrColumnWidth = 88;
  const leftColX = mainX + paddingX;
  const leftColWidth = mainWidth - paddingX * 2 - qrColumnWidth;
  const qrSize = Math.min(76, bodyTop - bodyBottom - 14);

  const brCode = buildStaticPixBrCode({
    pixKey: input.plan.pixKey,
    amountCents: installment.amountCents,
    merchantName: normalizePixText(input.plan.beneficiary, 25),
    merchantCity: normalizePixText(input.settings.city, 15).toUpperCase(),
    txid: installment.txid,
  });

  const pixLineHeight = 5;
  const pixCodeSize = fitSingleLineFontSize({
    maxWidth: leftColWidth,
    minSize: 2,
    maxSize: 4.6,
    widthAtSize: (fontSize) => fontPix.widthOfTextAtSize(brCode, fontSize),
  });
  const pixCodeHeight = pixLineHeight;
  const pixHeaderHeight = 8;
  const valueBoxHeight = 20;

  const pixCodeBottom = bodyBottom + 2;
  page.drawText(brCode, {
    x: leftColX,
    y: pixCodeBottom,
    size: pixCodeSize,
    font: fontPix,
    color: hex(CARNE_PDF_COLORS.pixCode),
  });

  const pixHeaderY = pixCodeBottom + pixCodeHeight + 3;
  const pixHeader = 'PIX COPIA E COLA';
  page.drawText(pixHeader, {
    x: leftColX,
    y: pixHeaderY,
    size: 6,
    font,
    color: hex(CARNE_PDF_COLORS.label),
    maxWidth: leftColWidth,
  });

  const valorBoxY = pixHeaderY + pixHeaderHeight + 4;
  drawValorDocumentoBox(page, leftColX, valorBoxY, installment.amountCents, font, fontBold);

  const fieldsBottomLimit = valorBoxY + valueBoxHeight + 4;
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
  const qrX = mainX + mainWidth - paddingX - qrSize;
  const qrY = bodyBottom + (bodyTop - bodyBottom - qrSize) / 2;
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  const scanCaption = 'Escaneie com o app do seu banco';
  const scanWidth = font.widthOfTextAtSize(scanCaption, 5.5);
  page.drawText(scanCaption, {
    x: qrX + (qrSize - scanWidth) / 2,
    y: qrY - 8,
    size: 5.5,
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
  const label = 'Valor do documento';
  const amountText = `R$ ${formatCentsAsBrl(amountCents)}`;
  const labelSize = 6;
  const amountSize = 12;
  const labelWidth = font.widthOfTextAtSize(label.toUpperCase(), labelSize);
  const amountWidth = fontBold.widthOfTextAtSize(amountText, amountSize);
  const boxWidth = labelWidth + amountWidth + 28;
  const boxHeight = 20;

  page.drawRectangle({
    x,
    y,
    width: boxWidth,
    height: boxHeight,
    color: hex(CARNE_PDF_COLORS.valueBoxBg),
    borderColor: hex(CARNE_PDF_COLORS.border),
    borderWidth: 0.4,
  });

  page.drawText(label.toUpperCase(), {
    x: x + 8,
    y: y + 7,
    size: labelSize,
    font,
    color: hex(CARNE_PDF_COLORS.label),
  });
  page.drawText(amountText, {
    x: x + labelWidth + 18,
    y: y + 5,
    size: amountSize,
    font: fontBold,
    color: hex(CARNE_PDF_COLORS.primary600),
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
  page.drawText(label.toUpperCase(), {
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
