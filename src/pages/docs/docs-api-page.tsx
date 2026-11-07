import { useEffect, useRef } from 'react';
import { Card } from '../../components/ui';

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
      <Card className="text-sm text-muted-foreground">
        <p>
          Especificação em <code className="text-foreground">/api/openapi.json</code>. Faça login via{' '}
          <strong className="text-foreground">POST /api/auth/sign-in</strong>, copie <code className="text-foreground">accessToken</code>{' '}
          e use <strong className="text-foreground">Authorize</strong> com Bearer.
        </p>
      </Card>
      <div ref={mountRef} className="docs-swagger rounded-xl border border-border bg-card p-2" />
    </div>
  );
}
