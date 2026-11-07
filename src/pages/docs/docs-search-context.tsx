import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { TextInput } from '../../components/ui';

type DocsSearchContextValue = {
  query: string;
  setQuery: (value: string) => void;
};

const DocsSearchContext = createContext<DocsSearchContextValue | null>(null);

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
  return (
    <label className={`relative block min-w-0 ${className}`.trim()}>
      <span className="sr-only">Localizar na documentação</span>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <TextInput
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Localizar"
        className="h-10 w-full min-w-0 pl-10 text-sm"
        autoComplete="off"
      />
    </label>
  );
}
