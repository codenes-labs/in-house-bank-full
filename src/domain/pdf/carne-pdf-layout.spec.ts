import { describe, expect, it } from 'vitest';
import {
  CARNE_INSTALLMENTS_PER_PAGE,
  CARNE_PDF_FOOTER_HEIGHT_PT,
  CARNE_PDF_HEADER_BLOCK_HEIGHT_PT,
  CARNE_PDF_PAGE_HEIGHT_PT,
  CARNE_PDF_PAGE_MARGIN_PT,
  CARNE_PDF_ROW_GAP_PT,
  chunkInstallmentsByPage,
  computeCarneInstallmentRowHeightPt,
} from './carne-pdf-layout';

describe('computeCarneInstallmentRowHeightPt', () => {
  it('uses height of one slot on a four-installment page, not full page when fewer rows print', () => {
    const rowHeight = computeCarneInstallmentRowHeightPt();
    const usableHeight =
      CARNE_PDF_PAGE_HEIGHT_PT -
      CARNE_PDF_PAGE_MARGIN_PT * 2 -
      CARNE_PDF_HEADER_BLOCK_HEIGHT_PT -
      CARNE_PDF_FOOTER_HEIGHT_PT;

    expect(rowHeight).toBe(
      (usableHeight - CARNE_PDF_ROW_GAP_PT * (CARNE_INSTALLMENTS_PER_PAGE - 1)) /
        CARNE_INSTALLMENTS_PER_PAGE,
    );
    expect(rowHeight).toBeLessThan(usableHeight);
  });
});

describe('chunkInstallmentsByPage', () => {
  it('groups installments into pages of four', () => {
    const items = [1, 2, 3, 4, 5];
    expect(chunkInstallmentsByPage(items, CARNE_INSTALLMENTS_PER_PAGE)).toEqual([
      [1, 2, 3, 4],
      [5],
    ]);
  });
});
