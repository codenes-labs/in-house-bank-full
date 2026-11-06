/// <reference types="@cloudflare/workers-types" />

import { createApiHandler } from '../src/server/create-api-handler';

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api')) {
      const handler = createApiHandler({
        databaseUrl: env.DATABASE_URL,
        jwtSecret: env.JWT_SECRET,
      });
      return handler(request);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
