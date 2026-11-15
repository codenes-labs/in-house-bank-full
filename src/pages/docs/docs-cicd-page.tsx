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
      <DocsSection title="Rollback em produção">
        <p>
          O deploy na <code className="text-foreground">master</code> publica Worker{' '}
          <code className="text-foreground">in-house-bank-full</code> e o <code className="text-foreground">dist</code> da SPA. Mudanças só de
          devcontainer/Docker local não entram nesse pacote — o risco de quebra em produção vem do código que o build e o Worker empacotam.
        </p>
        <p className="mt-3 font-medium text-foreground">Quando usar cada caminho</p>
        <DocsList
          items={[
            'Workflow Deploy falhou — produção não recebeu versão nova; corrija e faça push na master',
            'Deploy verde mas API ou site com defeito — rollback do Worker (Cloudflare ou wrangler)',
            'Defeito no código mergeado — git revert na master + push (dispara Deploy de novo)',
          ]}
        />
        <p className="mt-3 font-medium text-foreground">1. Cloudflare (mais rápido)</p>
        <p>
          Dashboard → Workers &amp; Pages → <code className="text-foreground">in-house-bank-full</code> → Deployments → rollback na versão
          anterior estável. Reverte Worker e assets; secrets no Worker e o banco Neon não mudam com esse passo.
        </p>
        <p className="mt-3 font-medium text-foreground">2. Wrangler (CLI)</p>
        <DocsList
          items={[
            'npx wrangler deployments list',
            'npx wrangler rollback <version-id> -y',
            'Requer CLOUDFLARE_API_TOKEN com permissão de deploy na conta do projeto',
          ]}
        />
        <p className="mt-3 font-medium text-foreground">3. Git revert + redeploy</p>
        <p>
          <code className="text-foreground">git revert -m 1 &lt;sha-do-merge&gt;</code> (ou revert do commit problemático) na{' '}
          <code className="text-foreground">master</code> e <code className="text-foreground">git push</code>. O workflow{' '}
          <code className="text-foreground">deploy.yml</code> publica o código revertido.
        </p>
        <p className="mt-3 font-medium text-foreground">Conferência após rollback ou revert</p>
        <DocsList
          items={[
            'GET /api/health — configured, database e jwt em true',
            'Login e um fluxo crítico (ex.: carnê ou configurações)',
          ]}
        />
      </DocsSection>
    </div>
  );
}
