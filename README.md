# In House Bank

Controle pessoal de empréstimos, parcelamentos, caixinhas e saldo livre. O app **não movimenta dinheiro** e **não é meio de pagamento**.

## Produção

| | URL |
| --- | --- |
| **Aplicação** | [https://inhousebank.codenes.com.br/](https://inhousebank.codenes.com.br/) |
| **Documentação** | [https://inhousebank.codenes.com.br/docs](https://inhousebank.codenes.com.br/docs) |
| **OpenAPI (Swagger)** | [https://inhousebank.codenes.com.br/docs/api](https://inhousebank.codenes.com.br/docs/api) |
| **Health da API** | [https://inhousebank.codenes.com.br/api/health](https://inhousebank.codenes.com.br/api/health) |

A documentação pública cobre stack, arquitetura, Neon, CI/CD, deploy e changelog (`SPEC-11`). Termos e privacidade: `/termos` e `/privacidade` no mesmo domínio.

## Stack (resumo)

React 19, Vite, TypeScript, Tailwind CSS 4, Vitest, Neon (Postgres), JWT, `pdf-lib`, `html2pdf.js` (extrato de saldo livre), Recharts. Produção: **Cloudflare Worker** servindo API (`/api/*`) e SPA no mesmo host.

### PDF no navegador

| Documento | Gerador | Código |
| --- | --- | --- |
| Carnê de parcelas | `pdf-lib` | `src/pdf/generate-carne-pdf.ts` |
| Extrato caixinha | `pdf-lib` | `src/pdf/generate-cash-box-extrato-pdf.ts` |
| Extrato saldo livre | HTML → `html2pdf.js` | `src/pdf/generate-free-balance-extrato-pdf.ts`, `src/pdf/free-balance-extrato/` |

Relatórios → Extrato (`tipo=caixinha` ou `tipo=saldo-livre`): filtro de período, histórico por mês na tela e download do PDF. O extrato de saldo livre calcula resumo e saldo após cada linha a partir do histórico e do `free_balance_cents` (ver `compute-free-balance-extrato-metrics.ts`).

## Dev Container (desenvolvimento)

Caminho recomendado: **Dev Containers: Reopen in Container** no Cursor (Docker acessível no WSL). Usa [`.docker/docker-compose.dev.yaml`](.docker/docker-compose.dev.yaml) — serviços **app** (onde você edita o código) + **db** (Postgres local).

### Primeira vez

```bash
cp .docker/.env.example .docker/.env   # DATABASE_URL @db:5432 + JWT (≥ 32 chars)
```

Reabra no Dev Container. Na criação roda `npm ci`; no start, [`.devcontainer/start-dev-server.sh`](.devcontainer/start-dev-server.sh) sobe o **Vite** se a porta ainda estiver livre.

**Não** rode `make dev` nem `npm run dev` ao abrir o container se o app já responder em `http://localhost:<PORT_EXTERNAL>` (padrão **5173**). Segunda instância do Vite gera conflito de porta e erros tipo tela branca / `504 Outdated Optimize Dep`. Se o servidor não subiu, veja `/tmp/vite.log` e só então `make dev`.

No browser (host): `http://localhost:<PORT_EXTERNAL>`. Com `DATABASE_URL` e `JWT_SECRET` em `.docker/.env`, `GET /api/health` deve retornar `configured`, `database` e `jwt` em `true`.

### Comandos no terminal do Dev Container

Atalhos via [`Makefile`](Makefile) — `make help`:

| Comando | Uso |
| --- | --- |
| `make test` / `make test-coverage` | Vitest (coverage = gate do CI) |
| `make api-token` | JWT da conta demo (`teste`/`teste`) para Swagger ou `curl` |
| `make lint` / `make build` | oxlint / build de produção |
| `make health` | `curl` em `/api/health` (Vite em 5173) |
| `make k6` | Smoke p95 de health (k6 na imagem dev) |

O Vite encaminha `/api/*` para o handler local (`pg` + Postgres do compose em dev).

### Smoke de latência (k6)

Com o Vite no ar:

```bash
make k6
```

Meta p95 &lt; 500 ms — [`docs/slo.md`](docs/slo.md). O binário **k6** vem na imagem [`.docker/Dockerfile.dev`](.docker/Dockerfile.dev). Após mudar o Dockerfile, **rebuild** do Dev Container (`Dev Containers: Rebuild Container`). Sem k6 no PATH, o `make k6` indica o `docker run` com `grafana/k6`.

### Variáveis (`.docker/.env`)

Copie de [`.docker/.env.example`](.docker/.env.example) (`make env-example` só cria o arquivo se ainda não existir — se o exemplo mudou, mescle as chaves novas no seu `.env`).

| Variável | Descrição |
| --- | --- |
| `PORT_INTERNAL` / `PORT_EXTERNAL` | Vite no container / porta no host |
| `POSTGRES_INTERNAL` / `POSTGRES_EXTERNAL` | Postgres no container / porta no host (`DBeaver`: `localhost:<POSTGRES_EXTERNAL>`) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciais do serviço `db` (devem bater com `DATABASE_URL`) |
| `DATABASE_URL` | `postgresql://USER:PASS@db:5432/DB` no Dev Container; `@localhost:5432` se `npm run dev` no host com só o `db` do compose |
| `JWT_SECRET` | ≥ 32 caracteres (`openssl rand -base64 48`) |
| `PROMETHEUS_*` / `GRAFANA_*` | Portas e login admin do stack de métricas (serviços **comentados** no compose leve — [`docs/metricas.md`](docs/metricas.md)) |
| `TURNSTILE_*` (opcional) | Cloudflare Turnstile em `/entrar` e `/recuperar-senha` |
| `AUTH_PASSWORD_RECOVER_ENABLED` / `AUTH_SIGN_UP_ENABLED` (opcional) | Dev: ligados por padrão; `false` simula produção |

Métricas locais (Prometheus + Grafana): [`docs/metricas.md`](docs/metricas.md). Logs: [`docs/observabilidade.md`](docs/observabilidade.md). OpenAPI: [`docs/openapi.yaml`](docs/openapi.yaml).

### Problemas comuns

- **`Git: cannot run ssh` no Cursor** — o container não tem `ssh`; o script `ensure-git-https-remote.sh` troca `origin` para HTTPS. **Push** siga fazendo no **host** (WSL), onde você já tem SSH ou PAT.
- **`localhost:5173` com `ERR_EMPTY_RESPONSE`** — o Vite ainda não subiu ou a porta do Docker não está mapeada. No terminal do container: `bash .devcontainer/start-dev-server.sh` ou `make dev`. Confira `tail -f /tmp/vite.log`. A porta vem do compose (`PORT_EXTERNAL` no host = `PORT_INTERNAL` no app); o Dev Container **não** reencaminha a 5173 (evita conflito com o publish do Docker). Use a mesma porta do `.docker/.env` (padrão 5173).
- **`npm ci` com permissão negada** — `make docker-dev-down`, remova o volume `node_modules` (`docker volume ls`) e reabra o Dev Container.
- **Postgres no DBeaver (host)** — `localhost:<POSTGRES_EXTERNAL>` (padrão 5432), não `db` (só resolve dentro do compose).
- **Sem Dev Container** — na máquina com Docker: `make docker-dev` sobe o mesmo compose (Vite na porta publicada).

## Produção local (validação)

Antes de `wrangler deploy`, opcionalmente valide o pacote Worker + SPA:

```bash
cp .docker/.env.example .docker/.env   # Neon ou URL que o teste exigir
make docker-prod
# ou: docker compose -f compose.prod.yaml up --build
```

Acesse [http://localhost:8787](http://localhost:8787). Smoke: `make k6-prod`. Deploy real: Cloudflare (`npm run deploy` / push na `master`), não esta imagem.

## Deploy

```bash
npm run build
npm run deploy   # wrangler
```

No **GitHub Actions** (push em `master`), após lint e testes, o workflow faz build e `wrangler deploy`.

Secrets em **Settings → Secrets and variables → Actions** (e no Worker em produção):

| Secret | Uso |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Deploy Worker |
| `CLOUDFLARE_ACCOUNT_ID` | Conta Cloudflare |
| `DATABASE_URL` | Neon (somente servidor) |
| `JWT_SECRET` | Assinatura JWT (somente servidor) |

### API “não configurada”

O front chama `/api/*` no **mesmo domínio** do Worker (`in-house-bank-full`), não em um host Pages isolado.

1. Confira [`/api/health`](https://inhousebank.codenes.com.br/api/health): esperado `{"configured":true,"database":true,"jwt":true}`.
2. Se `database` ou `jwt` for `false`, ajuste **Variables and Secrets** no Worker (`DATABASE_URL`, `JWT_SECRET`, alinhados ao CI).
3. Dispare o workflow **Deploy** ou `npm run deploy` de novo.

Domínio customizado: **Workers & Pages → in-house-bank-full → Settings → Domains & Routes**.

### Rollback em produção

| Situação | Ação |
| --- | --- |
| Workflow **Deploy** falhou | Produção não foi atualizada; corrija e faça push na `master`. |
| Deploy OK, mas site/API com defeito | **Cloudflare:** Workers & Pages → `in-house-bank-full` → Deployments → rollback na versão anterior. Ou `npx wrangler deployments list` e `npx wrangler rollback <version-id> -y`. |
| Defeito no código mergeado | `git revert` na `master` + `git push` (dispara Deploy de novo). |

Rollback do Worker reverte código e assets estáticos; **não** altera secrets nem o Neon. Depois confira [`/api/health`](https://inhousebank.codenes.com.br/api/health) e um fluxo crítico. Detalhes em [`/docs/ci-cd`](https://inhousebank.codenes.com.br/docs/ci-cd) (seção *Rollback em produção*).

## Documentação no repositório

| Documento | Conteúdo |
| --- | --- |
| [`docs/principios.md`](docs/principios.md) | SDD, camadas, convenções |
| [`docs/arquitetura.md`](docs/arquitetura.md) | Visão técnica do monólito |
| [`docs/banco.md`](docs/banco.md) | Schema, RLS, migrações Neon |
| [`docs/estado-atual.md`](docs/estado-atual.md) | UI e rotas atuais |
| [`docs/specs/`](docs/specs/) | Especificações (SPEC-01+) |
| [`docs/slo.md`](docs/slo.md) | SLO Projeto B (p95 health) |
| [`docs/openapi.yaml`](docs/openapi.yaml) | Contrato HTTP `/api/*` (auth JWT, banco, sistema) |
| [`docs/adr/`](docs/adr/) | Decisões de arquitetura (MADR) |
| [`AGENTS.md`](AGENTS.md) | Regras para agentes e contribuidores |

As decisões de arquitetura seguem **SOLID** na prática — domínio isolado, `BankRepository` como abstração única de dados e implementações trocáveis (HTTP vs memória). O padrão e a rejeição de SQL na UI estão no [ADR 0001](docs/adr/0001-bank-repository.md) e em [`docs/arquitetura.md`](docs/arquitetura.md).

Para implementar features: spec em `docs/specs` → testes → código (ver skills em `.cursor/skills`).