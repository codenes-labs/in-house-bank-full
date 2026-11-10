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

```bash
npm install
npm test
npm run dev
```

### Variáveis de ambiente

Copie `.docker/.env.example` para `.docker/.env` e preencha:

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | Connection string do Neon |
| `JWT_SECRET` | Pelo menos 32 caracteres (`openssl rand -base64 48`) |

Em dev, o Vite encaminha `/api/*` para o handler local.

### Docker (desenvolvimento)

Com Docker instalado, na raiz do repositório:

```bash
cp .docker/.env.example .docker/.env   # opcional: Neon + JWT
docker compose -f .docker/docker-compose.dev.yaml up --build
```

O app fica em [http://localhost:5173](http://localhost:5173). Com `.docker/.env` preenchido, [`/api/health`](http://localhost:5173/api/health) deve mostrar `configured`, `database` e `jwt` como `true`. Sem o arquivo, o container sobe e o health responde com tudo `false`.

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
| [`AGENTS.md`](AGENTS.md) | Regras para agentes e contribuidores |

Para implementar features: spec em `docs/specs` → testes → código (ver skills em `.cursor/skills`).
