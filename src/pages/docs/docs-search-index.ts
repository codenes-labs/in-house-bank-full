import { DOCS_NAV } from './docs-nav';
import { DOCS_SEARCH_TOPICS } from './docs-search-content';

export interface DocsSearchMatch {
  sectionTitle: string;
}

export interface DocsSearchResult {
  to: string;
  label: string;
  matches: DocsSearchMatch[];
}

/** @deprecated Mantido para testes que inspecionam keywords; preferir DOCS_SEARCH_TOPICS. */
export const DOCS_SEARCH_INDEX = DOCS_SEARCH_TOPICS.map((topic) => ({
  to: topic.to,
  label: topic.label,
  keywords: topic.keywords,
}));

const NAV_LABEL_BY_TO = new Map<string, string>(DOCS_NAV.map((item) => [item.to, item.label]));

const TOPIC_ORDER = new Map<string, number>([
  ['/docs', 0],
  ...DOCS_NAV.map((item, index) => [item.to, index + 1] as const),
]);

function normalizeForSearch(text: string): string {
  return text.trim().toLowerCase();
}

function haystackIncludes(haystack: string, needle: string): boolean {
  return normalizeForSearch(haystack).includes(needle);
}

export function filterDocsSearch(query: string): DocsSearchResult[] {
  const normalized = normalizeForSearch(query);
  if (!normalized) {
    return [];
  }

  const results: DocsSearchResult[] = [];

  for (const topic of DOCS_SEARCH_TOPICS) {
    const label = NAV_LABEL_BY_TO.get(topic.to) ?? topic.label;
    const matches: DocsSearchMatch[] = [];

    if (haystackIncludes(label, normalized)) {
      matches.push({ sectionTitle: 'Título do tópico' });
    }

    if (topic.keywords.some((keyword) => keyword.includes(normalized))) {
      const keyword = topic.keywords.find((k) => k.includes(normalized));
      if (keyword && !matches.some((m) => m.sectionTitle === `Palavra-chave: ${keyword}`)) {
        matches.push({ sectionTitle: `Palavra-chave: ${keyword}` });
      }
    }

    for (const section of topic.sections) {
      if (haystackIncludes(section.title, normalized) || haystackIncludes(section.body, normalized)) {
        if (!matches.some((m) => m.sectionTitle === section.title)) {
          matches.push({ sectionTitle: section.title });
        }
      }
    }

    if (matches.length > 0) {
      results.push({ to: topic.to, label, matches });
    }
  }

  results.sort((a, b) => (TOPIC_ORDER.get(a.to) ?? 99) - (TOPIC_ORDER.get(b.to) ?? 99));
  return results;
}