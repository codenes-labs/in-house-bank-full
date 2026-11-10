import { describe, expect, it } from 'vitest';
import { csvRow, escapeCsvCell } from './csv-cells';

describe('csv-cells', () => {
  it('quotes cells with separators', () => {
    expect(escapeCsvCell('a;b')).toBe('"a;b"');
    expect(escapeCsvCell('60,00')).toBe('60,00');
    expect(csvRow(['x', 'y'])).toBe('x;y');
  });
});
