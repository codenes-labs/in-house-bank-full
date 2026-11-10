# Banco

Postgres no [Neon](https://neon.tech). O schema sobe automaticamente pelo servidor em `src/server/schema.ts` na primeira requisição.

Tabelas de conta: `users`. Tabelas de dados: `settings`, `installment_plans`, `installments`, `cash_boxes`, `cash_box_movements`.

Todas as tabelas de dados têm `user_id` referenciando `users`. RLS compara `user_id` com `current_setting('app.user_id')`, definido pelo servidor em cada transação.

Gravação por registro. O backup JSON `version: 1` é a única substituição completa, e só dos dados do usuário que importou.

Segredos só no servidor (Worker ou dev Vite). Variáveis: `DATABASE_URL` e `JWT_SECRET` (mínimo 32 caracteres).

## Contas iniciais (seed)

Cadastro público fechado. Contas criadas pelo seed em `src/server/account-seed.ts`:

| Conta | Login | Senha inicial | Comportamento |
| --- | --- | --- | --- |
| Admin | `admin@codenes.com.br` | `CodenesTemp1` | Dados reais; trocar senha em `/alterar-senha` no primeiro acesso |
| Demo | `teste` ou `teste@teste.com` | `teste` | Dados fictícios; mutações ficam só na sessão (memória no app). O banco não grava alterações; cada login restaura o mock |

Recuperação de senha: `/recuperar-senha` (e-mail + nova senha). Não vale para a conta demo.
