import { describe, expect, it } from 'vitest';
import { activePublicToolLinks, PUBLIC_TOOL_LINKS } from './public-tools-catalog';

describe('public-tools-catalog', () => {
  it('exibe pelo menos organizador e gerar carnê', () => {
    const active = activePublicToolLinks();
    const ids = active.map((item) => item.id);
    expect(ids).toContain('organizador');
    expect(ids).toContain('gerar-carne');
    expect(active.length).toBeLessThanOrEqual(PUBLIC_TOOL_LINKS.length);
  });
});