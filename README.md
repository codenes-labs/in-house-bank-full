# In House Bank

Controle pessoal de empréstimos e compras parceladas. O app não movimenta dinheiro.

```bash
npm install
npm test
npm run dev
```

## Banco local (dev)

Copie `.docker/.env.example` para `.docker/.env` e preencha:

- `DATABASE_URL` — connection string do Neon
- `JWT_SECRET` — pelo menos 32 caracteres (`openssl rand -base64 48`)

O Vite expõe `/api/*` em desenvolvimento.

## Deploy (Cloudflare)

Build e publicação:

```bash
npm run deploy
```

No GitHub Actions (push em `master`), após lint e testes, o workflow faz build e `wrangler deploy`.

Secrets em **Settings → Secrets and variables → Actions**:

| Secret | Uso |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Deploy Worker |
| `CLOUDFLARE_ACCOUNT_ID` | Conta Cloudflare |
| `DATABASE_URL` | Neon (só servidor) |
| `JWT_SECRET` | Assinatura JWT (só servidor) |

Documentação do banco: `docs/banco.md`. Arquitetura: `docs/arquitetura.md`.

## Domínio customizado

No painel Cloudflare: **Workers & Pages → in-house-bank-full → Settings → Domains & Routes → Add Custom Domain**. Escolha o hostname (por exemplo `app.seudominio.com`). O DNS precisa estar na mesma conta Cloudflare; o registro é criado automaticamente. Depois do deploy, teste `/entrar` e uma rota interna (por exemplo `/inicio`) no novo domínio.

## API no ar (“não configurada”)

O front fala com `/api/*` no **mesmo domínio**. Isso só funciona no **Worker** `in-house-bank-full`, não no projeto Pages antigo (`*.pages.dev` sem Worker).

1. Abra **Workers & Pages → in-house-bank-full** e use o domínio **`*.workers.dev`** (ou o customizado ligado a **este** Worker).
2. Teste [`/api/health`](https://SEU-DOMINIO/api/health): deve retornar `{"configured":true,"database":true,"jwt":true}`.
3. Se `database` ou `jwt` for `false`, no painel **Settings → Variables and Secrets** do Worker confira os secrets **`DATABASE_URL`** e **`JWT_SECRET`** (mesmos valores do GitHub Actions, sem aspas).
4. Rode de novo o workflow **Deploy** ou `npm run deploy` com token Cloudflare local.

Valores locais ficam em `.docker/.env`; produção usa só secrets do Worker (via CI).
