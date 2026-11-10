import { DOCS_NAV } from './docs-nav';

export interface DocsSearchEntry {
  to: string;
  label: string;
  keywords: readonly string[];
}

export const DOCS_SEARCH_INDEX: readonly DocsSearchEntry[] = [
  {
    to: '/docs',
    label: 'Visão geral',
    keywords: ['produto', 'carnê', 'patrimônio', 'parcelamento', 'overview'],
  },
  {
    to: '/docs/stack',
    label: 'Stack',
    keywords: ['react', 'vite', 'typescript', 'tailwind', 'vitest', 'recharts', 'pdf'],
  },
  {
    to: '/docs/arquitetura',
    label: 'Arquitetura',
    keywords: ['domínio', 'repositório', 'camadas', 'worker', 'spa', 'jwt'],
  },
  {
    to: '/docs/banco',
    label: 'Banco Neon',
    keywords: ['postgres', 'neon', 'rls', 'user_id', 'backup', 'migração', 'schema'],
  },
  {
    to: '/docs/ci-cd',
    label: 'CI/CD',
    keywords: ['github', 'actions', 'lint', 'testes', 'workflow', 'master'],
  },
  {
    to: '/docs/deploy',
    label: 'Deploy',
    keywords: ['cloudflare', 'wrangler', 'secrets', 'worker', 'build'],
  },
  {
    to: '/docs/api',
    label: 'API (OpenAPI)',
    keywords: ['swagger', 'openapi', 'bearer', 'auth', 'sign-in', 'rest', 'http'],
  },
  {
    to: '/docs/apresentacao',
    label: 'Apresentação',
    keywords: ['vídeo', 'roteiro', 'demo', 'apresentação'],
  },
  {
    to: '/docs/changelog',
    label: 'Changelog',
    keywords: ['versão', 'release', 'novidades', 'histórico', '0.2.1', '0.2.0'],
  },
];

const NAV_LABEL_BY_TO = new Map<string, string>(DOCS_NAV.map((item) => [item.to, item.label]));

export function filterDocsSearch(query: string): DocsSearchEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }
  return DOCS_SEARCH_INDEX.filter((entry) => {
    const label = NAV_LABEL_BY_TO.get(entry.to) ?? entry.label;
    if (label.toLowerCase().includes(normalized)) {
      return true;
    }
    return entry.keywords.some((keyword) => keyword.includes(normalized));
  });
}

export function docsSearchMatchHint(entry: DocsSearchEntry, query: string): string | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  const label = (NAV_LABEL_BY_TO.get(entry.to) ?? entry.label).toLowerCase();
  if (label.includes(normalized)) {
    return null;
  }
  return entry.keywords.find((keyword) => keyword.includes(normalized)) ?? null;
}
