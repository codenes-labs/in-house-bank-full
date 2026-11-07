import { DocsList, DocsSection } from './docs-prose';

export function DocsCicdPage() {
  return (
    <div className="grid gap-4">
      <DocsSection title="GitHub Actions">
        <p>Dois workflows em <code className="text-foreground">.github/workflows/</code>:</p>
        <DocsList
          items={[
            'developer.yml — push em branches que não são master: lint (oxlint) → testes (Vitest)',
            'deploy.yml — push em master: lint → testes → build → deploy Cloudflare',
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
          Nenhum deploy sem lint e testes verdes na master. SPEC-09 (Projeto B) prevê coverage mínimo e outras melhorias de
          pipeline — ainda não aplicadas.
        </p>
      </DocsSection>
    </div>
  );
}
