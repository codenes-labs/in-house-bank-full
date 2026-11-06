import { describe, expect, it } from 'vitest';
import { buildCarnePdfFilename } from './build-carne-pdf-filename';

describe('buildCarnePdfFilename', () => {
  it('follows RN-11 naming pattern', () => {
    expect(buildCarnePdfFilename('Maria Silva', 'Notebook 2026', '2026-11-09')).toBe(
      'carne-maria-silva-notebook-2026-20261109.pdf',
    );
  });
});
