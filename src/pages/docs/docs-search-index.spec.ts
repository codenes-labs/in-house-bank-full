import { describe, expect, it } from 'vitest';
import { filterDocsSearch } from './docs-search-index';

describe('filterDocsSearch', () => {
  it('returns nothing when query is empty', () => {
    expect(filterDocsSearch('')).toHaveLength(0);
  });

  it('suggests by label and keywords', () => {
    expect(filterDocsSearch('neon').map((entry) => entry.to)).toEqual(['/docs/banco']);
    expect(filterDocsSearch('swagger').map((entry) => entry.to)).toEqual(['/docs/api']);
    expect(filterDocsSearch('vite').map((entry) => entry.to)).toEqual(['/docs/stack']);
  });
});
