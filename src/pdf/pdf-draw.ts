import { rgb, type PDFPage } from 'pdf-lib';

export function pdfHex(value: string) {
  const normalized = value.replace('#', '');
  const numeric = Number.parseInt(normalized, 16);
  return rgb(((numeric >> 16) & 255) / 255, ((numeric >> 8) & 255) / 255, (numeric & 255) / 255);
}

export function drawRoundedRect(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: ReturnType<typeof rgb>,
): void {
  const corner = Math.min(radius, width / 2, height / 2);
  page.drawRectangle({ x: x + corner, y, width: width - corner * 2, height, color });
  page.drawRectangle({ x, y: y + corner, width, height: height - corner * 2, color });
  page.drawEllipse({ x: x + corner, y: y + corner, xScale: corner, yScale: corner, color });
  page.drawEllipse({ x: x + width - corner, y: y + corner, xScale: corner, yScale: corner, color });
  page.drawEllipse({ x: x + corner, y: y + height - corner, xScale: corner, yScale: corner, color });
  page.drawEllipse({
    x: x + width - corner,
    y: y + height - corner,
    xScale: corner,
    yScale: corner,
    color,
  });
}

export function drawRoundedRectBorder(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: ReturnType<typeof rgb>,
  border: ReturnType<typeof rgb>,
  borderWidth = 1,
): void {
  drawRoundedRect(page, x - borderWidth, y - borderWidth, width + borderWidth * 2, height + borderWidth * 2, radius + 1, border);
  drawRoundedRect(page, x, y, width, height, radius, fill);
}

export function drawAccentCapsule(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  color: ReturnType<typeof rgb>,
): void {
  drawRoundedRect(page, x, y, width, height, height / 2, color);
}
