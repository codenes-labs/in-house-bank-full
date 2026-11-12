# SLO (Projeto B)

## Objetivo

`GET /api/health` responde rápido o bastante para smoke local e monitoramento leve, **sem consultar o banco**.

## SLO

| Indicador | Meta | Como medir |
| --- | --- | --- |
| Latência p95 de `GET /api/health` | **&lt; 500 ms** | `k6 run -e BASE_URL=http://localhost:5173 perf/health-smoke.js` com o app no ar |

## Observações

- A API roda no **Cloudflare Worker**; o contador `api_requests_total` (`GET /api/metrics`) é **por isolate** e zera quando o isolate reinicia — adequado para demo do Projeto B, não para Prometheus em produção.
- Logs estruturados: uma linha JSON por requisição `/api/*` (`time`, `level`, `method`, `path`, `status`, `durationMs`), sem corpo, token nem segredos.
