import { describe, expect, it } from 'vitest';
import { normalizePixText } from './normalize-pix-text';

describe('normalizePixText', () => {
  it('removes accents and truncates to max length', () => {
    expect(normalizePixText('São Paulo', 15)).toBe('Sao Paulo');
    expect(normalizePixText('Beneficiário Longo Nome Demais', 25)).toBe(
      'Beneficiario Longo Nome D',
    );
  });
});
