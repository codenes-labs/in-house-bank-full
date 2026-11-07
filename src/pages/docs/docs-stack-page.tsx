import { DocsList, DocsSection } from './docs-prose';

export function DocsStackPage() {
  return (
    <div className="grid gap-4">
      <DocsSection title="Front-end">
        <DocsList
          items={[
            'React 19 + React Router 7',
            'Vite 8 (build e dev server)',
            'TypeScript estrito',
            'Tailwind CSS 4 + componentes em src/components',
            'Lucide React (ícones)',
            'Recharts (relatórios atuais; SPEC-10 prevê extrato em texto)',
            'pdf-lib + qrcode (PDF de carnê no navegador)',
          ]}
        />
      </DocsSection>
      <DocsSection title="Back-end e dados">
        <DocsList
          items={[
            'API em src/server/create-api-handler.ts (rotas /api/*)',
            'Neon Postgres (@neondatabase/serverless)',
            'JWT HS256 para sessão (Bearer no cliente)',
            'Schema e RLS em src/server/schema.ts',
          ]}
        />
      </DocsSection>
      <DocsSection title="Qualidade e entrega">
        <DocsList
          items={[
            'Vitest (testes unitários em src/**/*.spec.ts)',
            'oxlint (npm run lint)',
            'Wrangler 4 + Cloudflare Worker',
            'GitHub Actions (.github/workflows)',
          ]}
        />
      </DocsSection>
      <DocsSection title="Princípios de código">
        <p>
          Domínio puro em <code className="text-foreground">src/domain</code>, sem React. Dinheiro em centavos inteiros.
          Datas <code className="text-foreground">YYYY-MM-DD</code>. Specs em <code className="text-foreground">docs/specs</code>{' '}
          antes de features de produção (SDD).
        </p>
      </DocsSection>
    </div>
  );
}
