import { useEffect, useRef } from 'react';
import { Card } from '../../components/ui';
import { DocsList, DocsSection } from './docs-prose';

declare global {
  interface Window {
    SwaggerUIBundle?: (config: Record<string, unknown>) => void;
  }
}

const SWAGGER_CSS = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';
const SWAGGER_BUNDLE = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';

function loadStylesheet(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error('Falha ao carregar estilos Swagger.'));
    document.head.appendChild(link);
  });
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar Swagger UI.'));
    document.body.appendChild(script);
  });
}

export function DocsApiPage() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await loadStylesheet(SWAGGER_CSS);
        await loadScript(SWAGGER_BUNDLE);
        if (cancelled || !window.SwaggerUIBundle || !mountRef.current) {
          return;
        }
        mountRef.current.innerHTML = '<div id="swagger-ui"></div>';
        window.SwaggerUIBundle({
          url: '/api/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          persistAuthorization: true,
          tryItOutEnabled: true,
          displayRequestDuration: true,
        });
      } catch {
        if (mountRef.current) {
          mountRef.current.textContent = 'Não foi possível carregar o Swagger UI.';
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-4">
      <Card className="grid gap-4 text-sm text-muted-foreground">
        <p>
          Contrato em <code className="text-foreground">/api/openapi.json</code>. Rotas de banco exigem{' '}
          <code className="text-foreground">Authorization: Bearer &lt;accessToken&gt;</code> (JWT devolvido no login).
        </p>
        <DocsSection title="Testar no Swagger (Authorize)">
          <DocsList
            items={[
              'Com o app no ar (dev: http://localhost:5173, produção: mesma origem de /docs/api), abra POST /api/auth/sign-in, Try it out.',
              'Dev local — conta demo (dados fictícios): e-mail teste ou teste@teste.com, senha teste (ver docs/banco.md).',
              'Dev local — conta admin (dados reais no Postgres): admin@codenes.com.br / CodenesTemp1 (troque a senha depois).',
              'Na resposta 200, copie accessToken. Clique em Authorize no topo do Swagger, cole só o token (sem a palavra Bearer).',
              'Execute GET /api/bank ou outras rotas protegidas; o Swagger envia o header Bearer.',
            ]}
          />
        </DocsSection>
        <DocsSection title="Terminal (Makefile)">
          <p>
            No repositório, com API em <code className="text-foreground">BASE_URL</code> (padrão{' '}
            <code className="text-foreground">http://localhost:5173</code>):
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground">
            {`make api-token
# ou admin:
make api-token API_LOGIN=admin@codenes.com.br API_PASSWORD=CodenesTemp1
# usar em curl:
TOKEN=$(make -s api-token)
curl -sS -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/bank" | head`}
          </pre>
          <p className="mt-2">
            Turnstile: em produção o login pode exigir captcha — use o sign-in no navegador ou no Swagger com{' '}
            <code className="text-foreground">turnstileToken</code>. No dev sem{' '}
            <code className="text-foreground">TURNSTILE_SECRET_KEY</code>, email e senha bastam.
          </p>
        </DocsSection>
      </Card>
      <div ref={mountRef} className="docs-swagger rounded-xl border border-border bg-card p-2" />
    </div>
  );
}