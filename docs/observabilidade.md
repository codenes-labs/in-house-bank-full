# Observabilidade (Projeto B)

Contrato HTTP completo das rotas `/api/*`: [`openapi.yaml`](openapi.yaml).

## Logs estruturados

Cada resposta de `/api/*` gera **uma linha JSON** em `stdout` via `src/server/request-log.ts`:

| Campo | Significado |
| --- | --- |
| `time` | ISO 8601 |
| `level` | Sempre `info` hoje |
| `method` | HTTP (GET, POST, …) |
| `path` | Caminho sem query string |
| `status` | Código HTTP |
| `durationMs` | Tempo da requisição no handler |

Sem corpo, token, `DATABASE_URL` nem `JWT_SECRET`.

## Onde ver os logs

### Dev Container ou `npm run dev` no compose

1. No terminal onde roda `npm run dev` (container **app**).
2. Faça qualquer chamada `/api/*` (ex.: abrir o app ou `curl http://localhost:5173/api/health`).
3. A linha JSON aparece no mesmo terminal.

No Dev Container: **Terminal** integrado → `npm run dev` → requisições à API.

### Docker Compose (`make docker-dev`)

- Só Vite no terminal: logs da API no processo `npm run dev` dentro do **app**.
- Logs do Postgres: `docker compose -f .docker/docker-compose.dev.yaml logs db` (erros de conexão, startup).
- Logs do container app sem Vite: `docker compose -f .docker/docker-compose.dev.yaml logs app` (se o CMD for o dev server pelo compose).

Filtrar JSON da API (no host):

```bash
npm run dev 2>&1 | grep '"path":"/api'
```

### Produção (Cloudflare Worker)

- **Logs:** Workers & Pages → **in-house-bank-full** → **Logs** (ou **Observability**). Entradas `console.log` do Worker incluem as linhas JSON das rotas `/api/*`.
- **Métrica leve:** `GET https://<seu-dominio>/api/metrics` → texto `api_requests_total N` (contador **por isolate**, zera ao reiniciar o isolate — ver [`docs/slo.md`](slo.md)).
- `wrangler.toml` tem `[observability] enabled = true` para telemetria na Cloudflare.

## Métrica e SLO

- Contador: `GET /api/metrics` (formato de exposição Prometheus: `# TYPE`, `api_requests_total`).
- **Dev:** Prometheus + Grafana no compose — [`docs/metricas.md`](metricas.md).
- SLO de latência: p95 &lt; 500 ms em `GET /api/health` — [`docs/slo.md`](slo.md) e `perf/health-smoke.js`.

## Lint (Projeto B)

O pipeline roda **`npm run lint`** (**oxlint**), não ESLint. O slide do Projeto B cita ESLint como **exemplo**; este repositório adota oxlint no CI desde o início (SPEC-09 e workflows).