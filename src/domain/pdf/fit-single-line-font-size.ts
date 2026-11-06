export interface FitSingleLineFontSizeInput {
  maxWidth: number;
  minSize: number;
  maxSize: number;
  widthAtSize: (fontSize: number) => number;
  step?: number;
}

/** Picks the largest font size so measured text width fits within maxWidth (single line). */
export function fitSingleLineFontSize(input: FitSingleLineFontSizeInput): number {
  const step = input.step ?? 0.1;
  for (let size = input.maxSize; size >= input.minSize; size -= step) {
    if (input.widthAtSize(size) <= input.maxWidth) {
      return Math.round(size * 10) / 10;
    }
  }
  return input.minSize;
}
