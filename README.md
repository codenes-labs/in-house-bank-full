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
