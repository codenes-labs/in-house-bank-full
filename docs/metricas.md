# Métricas (dev — Prometheus + Grafana)

## Ferramenta (Projeto A)

No repositório não há material completo do Projeto A; a [SPEC-09](specs/SPEC-09-projeto-b.md) lista, como escopo do **Projeto A**, métricas RED, **Prometheus**, **Grafana** e `prom-client`. O stack local de observabilidade segue essa linha: **Prometheus** faz scrape e **Grafana** exibe painéis — **somente no compose de desenvolvimento**.

**Sentry:** não há menção a Sentry em specs, README, ADRs, workflows nem em materiais do Projeto A/B versionados neste repo. Se o professor citou Sentry, confirme no enunciado do Projeto A (é outra categoria: erros e traces de aplicação, não métricas de série temporal como Prometheus).

**Produção não muda:** Cloudflare Worker continua sem Prometheus/Grafana; `GET /api/metrics` segue texto no mesmo host (agora com linhas `# TYPE` / `# HELP`).

## O que sobe no compose dev

| Serviço | Imagem | Porta no host (padrão) |
| --- | --- | --- |
| `prometheus` | `prom/prometheus` | `PROMETHEUS_EXTERNAL` (9090) |
| `grafana` | `grafana/grafana` | `GRAFANA_EXTERNAL` (3000) |

Variáveis em [`.docker/.env.example`](../.docker/.env.example): `PROMETHEUS_*`, `GRAFANA_*`, `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD`.

Config: [`.docker/prometheus/prometheus.yml`](../.docker/prometheus/prometheus.yml) scrape `http://app:5173/api/metrics` (job `in-house-bank-api`).

## Pré-requisito: API no ar

O Prometheus aponta para o container **app** na porta do Vite. Com o compose de pé:

1. No **app** (Dev Container ou `docker exec`): `npm run dev`
2. Gere tráfego: navegue o app ou `curl http://localhost:5173/api/health`

Sem Vite, o target fica **DOWN** no Prometheus (esperado).

## Dev Container

1. **Reopen in Container** (sobe `app`, `db`, `prometheus`, `grafana`).
2. Terminal: `npm run dev`
3. Abra no navegador do host:
   - **Prometheus:** [http://localhost:9090](http://localhost:9090) → Status → Targets (`in-house-bank-api` = UP após tráfego)
   - **Grafana:** [http://localhost:3000](http://localhost:3000) — login `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` (padrão `admin` / `admin`)

Dashboard provisionado: **In House Bank — API** (`api_requests_total`).

Consulta útil no Prometheus: `api_requests_total{job="in-house-bank-api"}`.

## Sem Dev Container

```bash
make docker-dev
# outro terminal, dentro do app ou npm run dev no host conforme seu .env
```

Mesmas URLs `localhost:9090` e `localhost:3000`.

## Relação com Projeto B

- Log JSON: [`docs/observabilidade.md`](observabilidade.md)
- SLO k6: [`docs/slo.md`](slo.md)
- Endpoint legado: `GET /api/metrics` (texto Prometheus; contador **por processo**, não replica múltiplos isolates do Worker)