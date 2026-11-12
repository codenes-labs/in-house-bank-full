import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { ViteDevServer } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss(), neonApi()],
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 76,
        statements: 76,
        functions: 82,
        branches: 57,
      },
    },
  },
})

function neonApi() {
  return {
    name: 'neon-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (request, response, next) => {
        if (!request.url?.startsWith('/api')) {
          next()
          return
        }
        try {
          const mod = await server.ssrLoadModule('/src/server/create-api-handler.ts') as {
            createApiHandler: (options: {
              databaseUrl?: string
              jwtSecret?: string
              turnstileSecret?: string
              turnstileSiteKey?: string
              passwordRecoverEnabled?: boolean
            }) => (request: Request) => Promise<Response>
          }
          const recoverFlag = loadEnvValue('AUTH_PASSWORD_RECOVER_ENABLED')
          const handler = mod.createApiHandler({
            databaseUrl: loadEnvValue('DATABASE_URL'),
            jwtSecret: loadEnvValue('JWT_SECRET'),
            turnstileSecret: loadEnvValue('TURNSTILE_SECRET_KEY'),
            turnstileSiteKey: loadEnvValue('TURNSTILE_SITE_KEY'),
            passwordRecoverEnabled: recoverFlag !== 'false',
          })
          const webResponse = await handler(await toWebRequest(request))
          await writeWebResponse(response, webResponse)
        } catch (cause) {
          response.statusCode = 500
          response.end(cause instanceof Error ? cause.message : 'Falha no banco.')
        }
      })
    },
  }
}

function loadEnvValue(name: string): string | undefined {
  const fromProcess = process.env[name]?.trim()
  if (fromProcess) {
    return fromProcess
  }
  try {
    const text = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '.docker/.env'), 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith(`${name}=`)) {
        return trimmed.slice(name.length + 1).trim()
      }
      if (name === 'DATABASE_URL' && (trimmed.startsWith('postgresql://') || trimmed.startsWith('postgres://'))) {
        return trimmed
      }
    }
  } catch {
    return undefined
  }
  return undefined
}

async function toWebRequest(request: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = []
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const body = Buffer.concat(chunks)
  const headers = new Headers()
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === 'string') {
      headers.set(key, value)
    } else if (Array.isArray(value)) {
      headers.set(key, value.join(', '))
    }
  }
  return new Request(`http://${request.headers.host ?? 'localhost'}${request.url ?? '/'}`, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : body,
  })
}

async function writeWebResponse(response: ServerResponse, webResponse: Response): Promise<void> {
  response.statusCode = webResponse.status
  webResponse.headers.forEach((value, key) => {
    response.setHeader(key, value)
  })
  response.end(Buffer.from(await webResponse.arrayBuffer()))
}
