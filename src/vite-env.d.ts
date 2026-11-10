/// <reference types="vite/client" />

declare module 'html2pdf.js' {
  interface Html2PdfChain {
    set(options: Record<string, unknown>): Html2PdfChain;
    from(element: HTMLElement): Html2PdfChain;
    toPdf(): Html2PdfChain;
    get<T = unknown>(key: string): Promise<T>;
    outputPdf(type: 'arraybuffer'): Promise<ArrayBuffer>;
  }

  function html2pdf(): Html2PdfChain;
  export default html2pdf;
}
