/// <reference types="@cloudflare/workers-types" />

import { createApiHandler } from '../src/server/create-api-handler';

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
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
      });
      return handler(request);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
