export const CARNE_INSTALLMENTS_PER_PAGE = 4;

export const CARNE_PDF_PAGE_WIDTH_PT = 595.28;
export const CARNE_PDF_PAGE_HEIGHT_PT = 841.89;

export const CARNE_PDF_PAGE_MARGIN_PT = 24;
export const CARNE_PDF_HEADER_BLOCK_HEIGHT_PT = 52;
export const CARNE_PDF_FOOTER_HEIGHT_PT = 18;
export const CARNE_PDF_ROW_GAP_PT = 5;

/** Fixed row height as on a full page of {@link CARNE_INSTALLMENTS_PER_PAGE} installments. */
export function computeCarneInstallmentRowHeightPt(
  installmentsPerPage = CARNE_INSTALLMENTS_PER_PAGE,
): number {
  const usableHeight =
    CARNE_PDF_PAGE_HEIGHT_PT -
    CARNE_PDF_PAGE_MARGIN_PT * 2 -
    CARNE_PDF_HEADER_BLOCK_HEIGHT_PT -
    CARNE_PDF_FOOTER_HEIGHT_PT;
  return (usableHeight - CARNE_PDF_ROW_GAP_PT * (installmentsPerPage - 1)) / installmentsPerPage;
}

export const CARNE_PDF_COLORS = {
  primary700: '#1E3A8A',
  primary600: '#1D4ED8',
  primary50: '#DBEAFE',
  accent: '#0F766E',
  valueBoxBg: '#CCFBF1',
  text: '#0F172A',
  muted: '#475569',
  label: '#64748B',
  pixCode: '#334155',
  border: '#E2E8F0',
  stubDivider: '#93C5FD',
  white: '#FFFFFF',
} as const;

export function chunkInstallmentsByPage<T>(
  items: T[],
  pageSize = CARNE_INSTALLMENTS_PER_PAGE,
): T[][] {
  const sorted = [...items];
  const pages: T[][] = [];
  for (let index = 0; index < sorted.length; index += pageSize) {
    pages.push(sorted.slice(index, index + pageSize));
  }
  return pages;
}
