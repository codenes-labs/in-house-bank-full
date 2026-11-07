import { describe, expect, it } from 'vitest';
import { filterDocsSearch } from './docs-search-index';

describe('filterDocsSearch', () => {
  it('returns all entries when query is empty', () => {
    expect(filterDocsSearch('')).toHaveLength(9);
  });

  it('filters by label and keywords', () => {
    expect(filterDocsSearch('neon').map((entry) => entry.to)).toEqual(['/docs/banco']);
    expect(filterDocsSearch('swagger').map((entry) => entry.to)).toEqual(['/docs/api']);
  });
});
