import type { PDFFont } from 'pdf-lib';

export function wrapPdfText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let current = words[0] ?? '';

  for (let index = 1; index < words.length; index += 1) {
    const word = words[index] ?? '';
    const next = `${current} ${word}`;
    if (font.widthOfTextAtSize(next, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [text];
}

export function wrapPdfTextByChar(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const char of text) {
    const next = current + char;
    if (current && font.widthOfTextAtSize(next, size) > maxWidth) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.length > 0 ? lines : [''];
}

/** Evita última linha do Pix com 1–3 caracteres soltos. */
export function balanceMonospaceLines(
  lines: string[],
  font: PDFFont,
  size: number,
  maxWidth: number,
  orphanMaxChars = 3,
): string[] {
  if (lines.length < 2) {
    return lines;
  }
  const last = lines[lines.length - 1] ?? '';
  if (last.length > orphanMaxChars) {
    return lines;
  }
  const merged = `${lines[lines.length - 2] ?? ''}${last}`;
  const next = [...lines.slice(0, -2), merged];
  if (font.widthOfTextAtSize(merged, size) <= maxWidth) {
    return next;
  }
  const reflow = wrapPdfTextByChar(merged, font, size, maxWidth);
  return [...lines.slice(0, -2), ...reflow];
}

export function limitPdfLines(lines: string[], maxLines: number): string[] {
  if (lines.length <= maxLines) {
    return lines;
  }
  const kept = lines.slice(0, maxLines);
  const last = kept[maxLines - 1] ?? '';
  kept[maxLines - 1] = last.endsWith('…') ? last : `${last}…`;
  return kept;
}
