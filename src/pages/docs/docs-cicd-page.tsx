import { DocsList, DocsSection } from './docs-prose';

export function DocsCicdPage() {
  return (
    <div className="grid gap-4">
      <DocsSection title="GitHub Actions">
        <p>Dois workflows em <code className="text-foreground">.github/workflows/</code>:</p>
        <DocsList
          items={[
            'developer.yml — branches (não master): lint → coverage → build',
            'deploy.yml — master: lint → coverage → build → validação de secrets → deploy Cloudflare',
          ]}
        />
      </DocsSection>
      <DocsSection title="Ambiente de CI">
        <DocsList
          items={[
            'Node.js 22',
            'npm ci + cache de dependências',
            'Concurrency por branch (developer cancela execução anterior)',
          ]}
        />
      </DocsSection>
      <DocsSection title="Gates">
        <p>
          Nenhum deploy sem lint e testes verdes na master. Coverage mínimo em <code className="text-foreground">vite.config.ts</code>{' '}
          (lines 76%, statements 76%, functions 82%, branches 57%). Métrica leve em <code className="text-foreground">GET /api/metrics</code>;
          SLO em <code className="text-foreground">docs/slo.md</code> (SPEC-09).
        </p>
      </DocsSection>
    </div>
  );
}
