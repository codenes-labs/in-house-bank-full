import { createServer, type Server } from 'node:http';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApiHandler } from './create-api-handler';
import { resetApiMetricsForTests } from './request-log';

async function withHttpServer(
  options: Parameters<typeof createApiHandler>[0],
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const handler = createApiHandler(options);
  const server = createServer((incoming, outgoing) => {
    void (async () => {
      const chunks: Buffer[] = [];
      for await (const chunk of incoming) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const body = Buffer.concat(chunks);
      const headers = new Headers();
      for (const [key, value] of Object.entries(incoming.headers)) {
        if (typeof value === 'string') {
          headers.set(key, value);
        } else if (Array.isArray(value)) {
          headers.set(key, value.join(', '));
        }
      }
      const host = incoming.headers.host ?? '127.0.0.1';
      const request = new Request(`http://${host}${incoming.url ?? '/'}`, {
        method: incoming.method,
        headers,
        body: incoming.method === 'GET' || incoming.method === 'HEAD' ? undefined : body,
      });
      const response = await handler(request);
      outgoing.statusCode = response.status;
      response.headers.forEach((value, key) => outgoing.setHeader(key, value));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    })();
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Servidor de teste não obteve porta.');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await run(baseUrl);
  } finally {
    await closeServer(server);
  }
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

describe('health integration (HTTP)', () => {
  beforeAll(() => {
    resetApiMetricsForTests();
  });

  it('GET /api/health without secrets returns configured false', async () => {
    await withHttpServer({}, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/health`);
      expect(response.status).toBe(200);
      const body = (await response.json()) as { configured: boolean; database: boolean; jwt: boolean };
      expect(body).toEqual({ configured: false, database: false, jwt: false });
    });
  });

  it('GET /api/health with fictional config does not need Neon', async () => {
    await withHttpServer(
      {
        databaseUrl: 'postgresql://user:pass@localhost:5432/fake',
        jwtSecret: 'x'.repeat(32),
      },
      async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/health`);
        expect(response.status).toBe(200);
        const body = (await response.json()) as { configured: boolean; database: boolean; jwt: boolean };
        expect(body).toEqual({ configured: true, database: true, jwt: true });
      },
    );
  });

  it('GET /api/metrics counts api requests after health', async () => {
    resetApiMetricsForTests();
    await withHttpServer({}, async (baseUrl) => {
      await fetch(`${baseUrl}/api/health`);
      const metrics = await fetch(`${baseUrl}/api/metrics`);
      expect(metrics.status).toBe(200);
      expect(metrics.headers.get('content-type')).toContain('text/plain');
      const text = await metrics.text();
      expect(text.trim()).toMatch(/^api_requests_total \d+$/);
      const total = Number(text.trim().split(/\s+/)[1]);
      expect(total).toBeGreaterThanOrEqual(1);
    });
  });
});
