/// <reference types="@cloudflare/workers-types" />

import { createApiHandler } from '../src/server/create-api-handler';

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  AUTH_PASSWORD_RECOVER_ENABLED?: string;
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api')) {
      const handler = createApiHandler({
        databaseUrl: env.DATABASE_URL?.trim(),
        jwtSecret: env.JWT_SECRET?.trim(),
        turnstileSecret: env.TURNSTILE_SECRET_KEY?.trim(),
        turnstileSiteKey: env.TURNSTILE_SITE_KEY?.trim(),
        passwordRecoverEnabled: env.AUTH_PASSWORD_RECOVER_ENABLED?.trim() === 'true',
      });
      return handler(request);
    }
    return withAssetSecurityHeaders(await env.ASSETS.fetch(request));
  },
} satisfies ExportedHandler<Env>;

function withAssetSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('x-frame-options', 'DENY');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
