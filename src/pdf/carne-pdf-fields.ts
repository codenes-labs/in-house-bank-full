import { type PDFFont, type PDFPage, rgb } from 'pdf-lib';
import { limitPdfLines, wrapPdfText } from './wrap-pdf-text';

type PdfColor = ReturnType<typeof rgb>;

export const CARNE_FIELD = {
  labelSize: 6,
  valueSize: 8,
  labelGap: 4,
  blockGap: 10,
  valueLineHeight: 12,
  referenteMaxLines: 2,
} as const;

/** Altura do conteúdo (rótulo + valor em uma linha). */
export function singleLineContentHeight(): number {
  return CARNE_FIELD.labelSize + CARNE_FIELD.labelGap + CARNE_FIELD.valueSize;
}

export function fieldBlockStride(contentHeight: number): number {
  return contentHeight + CARNE_FIELD.blockGap;
}

export function drawFieldBlock(
  page: PDFPage,
  x: number,
  y: number,
  label: string,
  value: string,
  font: PDFFont,
  fontBold: PDFFont,
  maxWidth: number,
  labelColor: PdfColor,
  valueColor: PdfColor,
): number {
  page.drawText(label, {
    x,
    y,
    size: CARNE_FIELD.labelSize,
    font,
    color: labelColor,
    maxWidth,
  });
  page.drawText(value, {
    x,
    y: y - CARNE_FIELD.labelSize - CARNE_FIELD.labelGap - CARNE_FIELD.valueSize,
    size: CARNE_FIELD.valueSize,
    font: fontBold,
    color: valueColor,
    maxWidth,
  });
  return singleLineContentHeight();
}

export function drawFieldBlockWrapped(
  page: PDFPage,
  x: number,
  y: number,
  label: string,
  value: string,
  font: PDFFont,
  fontBold: PDFFont,
  maxWidth: number,
  labelColor: PdfColor,
  valueColor: PdfColor,
  maxLines: number,
): number {
  page.drawText(label, {
    x,
    y,
    size: CARNE_FIELD.labelSize,
    font,
    color: labelColor,
    maxWidth,
  });

  const lines = limitPdfLines(
    wrapPdfText(value, fontBold, CARNE_FIELD.valueSize, maxWidth),
    maxLines,
  );
  let baseline = y - CARNE_FIELD.labelSize - CARNE_FIELD.labelGap;
  for (const line of lines) {
    baseline -= CARNE_FIELD.valueSize;
    page.drawText(line, {
      x,
      y: baseline,
      size: CARNE_FIELD.valueSize,
      font: fontBold,
      color: valueColor,
      maxWidth,
    });
    baseline -= CARNE_FIELD.valueLineHeight - CARNE_FIELD.valueSize;
  }

  return CARNE_FIELD.labelSize + CARNE_FIELD.labelGap + lines.length * CARNE_FIELD.valueLineHeight;
}
