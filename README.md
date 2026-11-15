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

## Desenvolvimento local

Atalhos via [`Makefile`](Makefile) (`make help`). Equivalente em npm:

```bash
npm install
npm test
npm run test:coverage   # mesmo que o CI; falha se coverage cair abaixo do piso
npm run dev
```

### Smoke de latência (k6)

Com o app no ar (`npm run dev` ou Docker na porta 5173):

```bash
make k6
# ou: k6 run -e BASE_URL=http://localhost:5173 perf/health-smoke.js
```

Meta p95 &lt; 500 ms para `GET /api/health` — ver [`docs/slo.md`](docs/slo.md). Contrato OpenAPI da API: [`docs/openapi.yaml`](docs/openapi.yaml) (estático; runtime em `GET /api/openapi.json` e Swagger em `/docs/api`). Logs: [`docs/observabilidade.md`](docs/observabilidade.md). Métricas locais (Prometheus + Grafana, só dev): [`docs/metricas.md`](docs/metricas.md).

### Variáveis de ambiente

Copie `.docker/.env.example` para `.docker/.env` e preencha:

| Variável | Descrição |
| --- | --- |
| `PORT_INTERNAL` / `PORT_EXTERNAL` | Portas do Vite (container / host) |
| `POSTGRES_*` | Usuário, senha, DB e portas do **Postgres** no compose |
| `DATABASE_URL` | No compose: `postgresql://USER:PASS@db:5432/DB` |
| `JWT_SECRET` | Pelo menos 32 caracteres (`openssl rand -base64 48`) |

O exemplo em [`.docker/.env.example`](.docker/.env.example) aponta para o **Postgres do compose** — não coloque a URL de produção aí. Deploy e Worker continuam com a connection string remota nos secrets do CI/Cloudflare.

Em dev, o Vite encaminha `/api/*` para o handler local.

### Dev Container

Com o Docker acessível a partir do WSL, abra o repositório no Cursor e rode **Dev Containers: Reopen in Container**. Usa o mesmo compose de [`.docker/docker-compose.dev.yaml`](.docker/docker-compose.dev.yaml). Portas em [`.docker/.env`](.docker/.env.example): `PORT_INTERNAL` (Vite) e `PORT_EXTERNAL` (host; padrão `5173` para ambas). Na primeira criação roda `npm ci`; em seguida o `postStartCommand` sobe o Vite (o compose **não** inicia o dev server no Dev Container, para não correr `npm ci` com o Vite já em memória — isso gerava tela branca e `504 Outdated Optimize Dep`). Não rode `npm run dev` de novo se a porta 5173 já estiver em uso; veja `/tmp/vite.log`. Se um volume antigo tiver permissão negada no `npm ci`, rode `make docker-dev-down` e remova o volume `node_modules` (`docker volume ls`) antes de subir de novo.

O app fica em `http://localhost:<PORT_EXTERNAL>`. Os demais segredos continuam em `.docker/.env`.

### Docker (desenvolvimento)

Com Docker instalado, na raiz do repositório:

```bash
cp .docker/.env.example .docker/.env   # Postgres local + JWT (ver tabela acima)
make docker-dev
```

Sobe **app** + **db** (`postgres:17-bookworm`). O app fica em `http://localhost:<PORT_EXTERNAL>`. Com `DATABASE_URL` e `JWT_SECRET` preenchidos, `/api/health` deve mostrar os três flags `true`. Na primeira API autenticada o schema e o seed sobem no banco local.

O código do host é montado no container (hot reload do Vite).

### Docker (produção local)

Imagem com build da SPA e **Worker via Wrangler** (mesmo modelo do deploy na Cloudflare), útil para validar o pacote antes do `wrangler deploy`:

```bash
cp .docker/.env.example .docker/.env   # recomendado para API funcional
docker compose -f compose.prod.yaml up --build
```

Acesse [http://localhost:8787](http://localhost:8787). Deploy real de produção continua sendo Cloudflare Worker (`npm run deploy`), não este container.

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
