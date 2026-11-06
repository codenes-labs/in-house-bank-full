export function downloadPdfBytes(filename: string, bytes: Uint8Array): void {
  const url = URL.createObjectURL(new Blob([bytes.slice()], { type: 'application/pdf' }));
  downloadPdfUrl(filename, url);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadPdfUrl(filename: string, url: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
