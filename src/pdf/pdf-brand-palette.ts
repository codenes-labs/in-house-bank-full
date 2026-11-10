import { pdfHex } from './pdf-draw';

/** Cores fixas dos PDFs — tema claro do app (`src/index.css`). */
export const PDF_PALETTE = {
  primary: pdfHex('#1E3A8A'),
  brand: pdfHex('#1D4ED8'),
  soft: pdfHex('#DBEAFE'),
  successSoft: pdfHex('#D1FAE5'),
  accent: pdfHex('#0F766E'),
  accentBright: pdfHex('#14B8A6'),
  statusPaid: pdfHex('#047857'),
  text: pdfHex('#0F172A'),
  muted: pdfHex('#475569'),
  label: pdfHex('#64748B'),
  border: pdfHex('#E2E8F0'),
  rowAlt: pdfHex('#F8FAFC'),
  white: pdfHex('#FFFFFF'),
  pixCode: pdfHex('#334155'),
  stubDivider: pdfHex('#A7F3D0'),
  danger: pdfHex('#B91C1C'),
  dangerSoft: pdfHex('#FEE2E2'),
} as const;
