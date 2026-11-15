import { Link } from 'react-router-dom';
import { DocsList, DocsSection } from './docs-prose';

export function DocsDeployPage() {
  return (
    <div className="grid gap-4">
      <DocsSection title="Cloudflare Worker">
        <p>
          <code className="text-foreground">worker/index.ts</code> publica API e SPA no mesmo domínio. Rotas{' '}
          <code className="text-foreground">/api/*</code> chamam <code className="text-foreground">createApiHandler</code>;
          demais rotas vão para o bucket de assets (fallback SPA).
        </p>
      </DocsSection>
      <DocsSection title="Build local">
        <DocsList items={['npm run build — tsc + Vite → dist/', 'npm run deploy — build + wrangler deploy']} />
      </DocsSection>
      <DocsSection title="Docker">
        <DocsList
          items={[
            'Desenvolvimento: docker compose -f .docker/docker-compose.dev.yaml up — Vite na 5173, env em .docker/.env',
            'Produção local: docker compose -f compose.prod.yaml up — Dockerfile na raiz, wrangler dev na 8787',
            'Deploy em nuvem: npm run deploy (Worker), não a imagem Docker de produção',
          ]}
        />
      </DocsSection>
      <DocsSection title="Secrets (GitHub → Worker)">
        <DocsList
          items={[
            'DATABASE_URL — connection string Neon',
            'JWT_SECRET — mínimo 32 caracteres',
            'CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID — wrangler-action',
            'Job sync secrets antes e depois do deploy (wrangler secret bulk)',
          ]}
        />
      </DocsSection>
      <DocsSection title="Produção vs desenvolvimento">
        <p>
          Em dev, o plugin Vite <code className="text-foreground">neon-api</code> monta as rotas{' '}
          <code className="text-foreground">/api</code> usando variáveis de <code className="text-foreground">.docker/.env</code>{' '}
          ou ambiente. O front usa sempre caminhos relativos <code className="text-foreground">/api/...</code>.
        </p>
      </DocsSection>
      <DocsSection title="Rollback">
        <p>
          Se um push na <code className="text-foreground">master</code> publicar uma versão ruim, use rollback no dashboard Cloudflare,{' '}
          <code className="text-foreground">wrangler rollback</code> ou <code className="text-foreground">git revert</code> + push. Passo a passo
          em{' '}
          <Link to="/docs/ci-cd" className="text-primary underline underline-offset-2">
            CI/CD → Rollback em produção
          </Link>
          .
        </p>
      </DocsSection>
    </div>
  );
}
