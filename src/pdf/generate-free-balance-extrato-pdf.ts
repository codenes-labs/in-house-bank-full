import type { FreeBalanceExtratoDocumentInput } from './free-balance-extrato/build-free-balance-extrato-html';
import { buildFreeBalanceExtratoHtml } from './free-balance-extrato/build-free-balance-extrato-html';

export type FreeBalanceExtratoPdfInput = FreeBalanceExtratoDocumentInput;

const PDF_MARGIN_MM = [14, 14, 20, 14] as const;

function brandFooterLabel(businessName: string | undefined): string {
  const brand = businessName?.trim() || 'Demo In House Bank';
  return `${brand} · Extrato do saldo livre`;
}

interface Html2PdfInstance {
  getNumberOfPages(): number;
  setPage(page: number): void;
  setDrawColor(r: number, g: number, b: number): void;
  setLineWidth(width: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  setFont(fontName: string, fontStyle: string): void;
  setFontSize(size: number): void;
  setTextColor(r: number, g: number, b: number): void;
  text(text: string, x: number, y: number, options?: { align?: 'right' | 'left' | 'center' }): void;
  output(type: 'arraybuffer'): ArrayBuffer;
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
}

function stampPageFooters(pdf: Html2PdfInstance, footerLeft: string): void {
  const totalPages = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const y = pageHeight - 6;

  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.2);
    pdf.line(PDF_MARGIN_MM[3], y - 4, pageWidth - PDF_MARGIN_MM[1], y - 4);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(footerLeft, PDF_MARGIN_MM[3], y);
    pdf.text(`Página ${page} de ${totalPages}`, pageWidth - PDF_MARGIN_MM[1], y, { align: 'right' });
  }
}

async function waitForIframeLayout(doc: Document, iframe: HTMLIFrameElement): Promise<void> {
  await new Promise<void>((resolve) => {
    if (doc.readyState === 'complete') {
      resolve();
      return;
    }
    doc.addEventListener('readystatechange', () => {
      if (doc.readyState === 'complete') {
        resolve();
      }
    });
  });

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  const contentWidth = 794;
  const contentHeight = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight, 1123);
  iframe.style.width = `${contentWidth}px`;
  iframe.style.height = `${contentHeight}px`;
}

export async function generateFreeBalanceExtratoPdf(input: FreeBalanceExtratoPdfInput): Promise<Uint8Array> {
  if (typeof document === 'undefined') {
    throw new Error('generateFreeBalanceExtratoPdf requer ambiente com DOM.');
  }

  const html = buildFreeBalanceExtratoHtml(input);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-12000px';
  iframe.style.top = '0';
  iframe.style.border = '0';
  iframe.style.width = '794px';
  iframe.style.height = '1123px';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error('Não foi possível preparar o extrato para PDF.');
  }

  doc.open();
  doc.write(html);
  doc.close();

  await waitForIframeLayout(doc, iframe);

  const footerLeft = brandFooterLabel(input.settings.businessName);

  try {
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default;
    const pdf = (await html2pdf()
      .set({
        margin: [...PDF_MARGIN_MM],
        filename: 'extrato-saldo-livre.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: 794,
          windowWidth: 794,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', 'section'] },
      })
      .from(doc.body)
      .toPdf()
      .get('pdf')) as Html2PdfInstance;

    stampPageFooters(pdf, footerLeft);
    const buffer = pdf.output('arraybuffer') as ArrayBuffer;
    return new Uint8Array(buffer);
  } finally {
    document.body.removeChild(iframe);
  }
}
