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
    </div>
  );
}
