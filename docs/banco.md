# Banco

Postgres no [Neon](https://neon.tech). O schema sobe automaticamente pelo servidor em `src/server/schema.ts` na primeira requisição.

Tabelas de conta: `users` (inclui `registration_code` único só dígitos — empresas a partir de `100001`, admin `0`, demo `1`; ver SPEC-18). Tabelas de dados: `settings` (nome da empresa = `business_name` / beneficiário), `installment_plans`, `installments`, `cash_boxes`, `cash_box_movements`.

Todas as tabelas de dados têm `user_id` referenciando `users`. RLS compara `user_id` com `current_setting('app.user_id')`, definido pelo servidor em cada transação.

Gravação por registro. O backup JSON `version: 1` é a única substituição completa, e só dos dados do usuário que importou.

Segredos só no servidor (Worker ou dev Vite). Variáveis: `DATABASE_URL` e `JWT_SECRET` (mínimo 32 caracteres).

## Desenvolvimento local (Docker / Dev Container)

O compose [`.docker/docker-compose.dev.yaml`](../.docker/docker-compose.dev.yaml) sobe **Postgres** (`postgres:17-bookworm`, serviço `db`). Em [`.docker/.env`](../.docker/.env.example), `DATABASE_URL` aponta para `db:5432` — não use a URL de produção. O Vite usa `pg` via `src/server/pg-neon-compat.ts` (`src/server/vite-api-handler.ts`). Produção (Worker, CI) continua com Neon e `@neondatabase/serverless` (`src/server/neon-sql.ts`).

## Contas iniciais (seed)

Cadastro público fechado. Contas criadas pelo seed em `src/server/account-seed.ts`:

| Conta | Login | Senha inicial | Comportamento |
| --- | --- | --- | --- |
| Admin | `admin@codenes.com.br` | `CodenesTemp1` | Dados reais; trocar senha em `/alterar-senha` no primeiro acesso |
| Demo | `teste` ou `teste@teste.com` | `teste` | Dados fictícios; mutações ficam só na sessão (memória no app). O banco não grava alterações; cada login restaura o mock |

Recuperação de senha: em **produção** desligada por padrão (`AUTH_PASSWORD_RECOVER_ENABLED=true` no Worker só se precisar do fluxo legado e-mail + nova senha com Turnstile). Em dev, ligada salvo `AUTH_PASSWORD_RECOVER_ENABLED=false`. Não vale para a conta demo. Ver [SPEC-14](specs/SPEC-14-recuperacao-senha.md).

Cadastro público (`/cadastro`): em **produção** desligado por padrão (`AUTH_SIGN_UP_ENABLED=true` no Worker só se aceitar cadastro aberto). Em dev, ligado salvo `AUTH_SIGN_UP_ENABLED=false`. Ver [SPEC-15](specs/SPEC-15-cadastro-dev-local.md).

Cadastro de empresas (holding): o login `admin@codenes.com.br` lista contas e cadastra empresas em `/holding/empresas` (só menu desktop). APIs `GET`/`POST /api/holding/companies` e `PATCH /api/holding/companies/{id}/access`. Ver [SPEC-17](specs/SPEC-17-holding-cadastro-empresas.md) e [SPEC-18](specs/SPEC-18-holding-lista-empresas-permissoes.md).
