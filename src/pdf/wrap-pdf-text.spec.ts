import { PDFDocument, StandardFonts } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { balanceMonospaceLines, limitPdfLines, wrapPdfText, wrapPdfTextByChar } from './wrap-pdf-text';

describe('wrapPdfText', () => {
  it('quebra referente longo por palavras', async () => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const text =
      'Compra de equipamentos para escritório com garantia estendida e nota fiscal eletrônica';
    const lines = wrapPdfText(text, font, 8, 120);
    expect(lines.length).toBeGreaterThan(1);
    expect(limitPdfLines(lines, 2)).toHaveLength(2);
    expect(limitPdfLines(lines, 2)[1]?.endsWith('…')).toBe(true);
  });

  it('balanceia linha monoespaçada órfã', async () => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Courier);
    const raw = wrapPdfTextByChar('00020126580014br.gov.bcb.pixAB', font, 6, 90);
    const balanced = balanceMonospaceLines(raw, font, 6, 90);
    if (balanced.length > 1) {
      expect((balanced[balanced.length - 1] ?? '').length).toBeGreaterThan(3);
    }
  });
});
