import { describe, expect, it } from 'vitest';
import { PRODUCT_CHANGELOG } from './product-changelog';

describe('PRODUCT_CHANGELOG', () => {
  it('lists releases in reverse chronological order', () => {
    const dates = PRODUCT_CHANGELOG.map((release) => release.date);
    const sorted = [...dates].sort((left, right) => right.localeCompare(left));
    expect(dates).toEqual(sorted);
  });

  it('uses semantic version labels', () => {
    for (const release of PRODUCT_CHANGELOG) {
      expect(release.version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});
