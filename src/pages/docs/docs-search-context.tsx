import { createContext, useContext, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { TextInput } from '../../components/ui';
import { DOCS_NAV } from './docs-nav';
import { docsSearchMatchHint, filterDocsSearch } from './docs-search-index';

type DocsSearchContextValue = {
  query: string;
  setQuery: (value: string) => void;
};

const DocsSearchContext = createContext<DocsSearchContextValue | null>(null);

const NAV_LABEL_BY_TO = new Map<string, string>(DOCS_NAV.map((item) => [item.to, item.label]));

export function DocsSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const value = useMemo(() => ({ query, setQuery }), [query]);
  return <DocsSearchContext.Provider value={value}>{children}</DocsSearchContext.Provider>;
}

export function useDocsSearch() {
  const value = useContext(DocsSearchContext);
  if (!value) {
    throw new Error('useDocsSearch deve ser usado dentro de DocsSearchProvider');
  }
  return value;
}

export function useDocsSearchOptional() {
  return useContext(DocsSearchContext);
}

export function DocsHeaderSearchField({ className = '' }: { className?: string }) {
  const { query, setQuery } = useDocsSearch();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const suggestions = useMemo(() => filterDocsSearch(query), [query]);
  const showSuggestions = query.trim().length > 0;

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`.trim()}>
      <label className="relative block w-full min-w-0">
        <span className="sr-only">Localizar na documentação</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <TextInput
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Localizar"
          className="h-10 w-full min-w-0 pl-10 text-sm"
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={showSuggestions ? listId : undefined}
          aria-autocomplete="list"
        />
      </label>
      {showSuggestions ? (
        <div
          className="absolute top-[calc(100%+0.35rem)] right-0 left-0 z-40 overflow-hidden rounded-xl border border-border bg-card shadow-card"
          role="listbox"
          id={listId}
        >
          {suggestions.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">Nenhum tópico relacionado.</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1">
              {suggestions.map((entry) => {
                const label = NAV_LABEL_BY_TO.get(entry.to) ?? entry.label;
                const hint = docsSearchMatchHint(entry, query);
                return (
                  <li key={entry.to}>
                    <Link
                      to={entry.to}
                      role="option"
                      className="block px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => setQuery('')}
                    >
                      <span className="font-semibold text-primary">{label}</span>
                      {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">Palavra-chave: {hint}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
