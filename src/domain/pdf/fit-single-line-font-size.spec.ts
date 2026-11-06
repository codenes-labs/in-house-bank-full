import { describe, expect, it } from 'vitest';
import { fitSingleLineFontSize } from './fit-single-line-font-size';

describe('fitSingleLineFontSize', () => {
  it('returns max size when text fits at max width', () => {
    const size = fitSingleLineFontSize({
      maxWidth: 200,
      minSize: 3,
      maxSize: 5,
      widthAtSize: (fontSize) => fontSize * 10,
    });
    expect(size).toBe(5);
  });

  it('shrinks font size until text fits max width', () => {
    const size = fitSingleLineFontSize({
      maxWidth: 30,
      minSize: 3,
      maxSize: 5,
      widthAtSize: (fontSize) => fontSize * 10,
    });
    expect(size).toBe(3);
  });

  it('returns min size when text still overflows at min size', () => {
    const size = fitSingleLineFontSize({
      maxWidth: 10,
      minSize: 3,
      maxSize: 5,
      widthAtSize: (fontSize) => fontSize * 10,
    });
    expect(size).toBe(3);
  });

  it('can shrink below 3.2pt when the payload is long', () => {
    const widthPerPoint = 86.4;
    const size = fitSingleLineFontSize({
      maxWidth: 240,
      minSize: 2,
      maxSize: 4.6,
      widthAtSize: (fontSize) => fontSize * widthPerPoint,
    });
    expect(size).toBeLessThanOrEqual(2.8);
    expect(size * widthPerPoint).toBeLessThanOrEqual(240);
  });
});
