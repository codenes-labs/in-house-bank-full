import type { PDFDocument, PDFImage } from 'pdf-lib';

export async function embedDataUrlImage(pdfDoc: PDFDocument, dataUrl?: string): Promise<PDFImage | null> {
  if (!dataUrl?.startsWith('data:image/')) {
    return null;
  }
  const [meta, base64] = dataUrl.split(',');
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
