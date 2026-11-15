import { describe, expect, it } from 'vitest';
import { filterDocsSearch } from './docs-search-index';

describe('filterDocsSearch', () => {
  it('returns nothing when query is empty', () => {
    expect(filterDocsSearch('')).toHaveLength(0);
  });

  it('suggests by label, keywords and page body', () => {
    expect(filterDocsSearch('neon').map((entry) => entry.to)).toContain('/docs/banco');
    expect(filterDocsSearch('swagger').map((entry) => entry.to)).toEqual(['/docs/api']);
    expect(filterDocsSearch('vite').map((entry) => entry.to)).toEqual(['/docs', '/docs/stack']);
  });

  it('matches body text such as Node.js in CI/CD', () => {
    const results = filterDocsSearch('node.js');
    expect(results.map((entry) => entry.to)).toEqual(['/docs/ci-cd']);
    expect(results[0]?.matches.some((m) => m.sectionTitle === 'Ambiente de CI')).toBe(true);
  });

  it('groups section hits under each topic', () => {
    const results = filterDocsSearch('docker');
    const deploy = results.find((entry) => entry.to === '/docs/deploy');
    expect(deploy?.matches.map((m) => m.sectionTitle)).toContain('Docker');
  });
});