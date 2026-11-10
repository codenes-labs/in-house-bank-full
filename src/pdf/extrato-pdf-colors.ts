import { PDF_PALETTE } from './pdf-brand-palette';

export const EXTRATO_PDF = {
  pageWidth: 595.28,
  pageHeight: 841.89,
  margin: 40,
  headerHeight: 56,
  contentRadius: 14,
  rowRadius: 8,
  ...PDF_PALETTE,
} as const;
