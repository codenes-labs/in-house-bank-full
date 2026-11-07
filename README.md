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

React 19, Vite, TypeScript, Tailwind CSS 4, Vitest, Neon (Postgres), JWT, `pdf-lib`, Recharts. Produção: **Cloudflare Worker** servindo API (`/api/*`) e SPA no mesmo host.

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
