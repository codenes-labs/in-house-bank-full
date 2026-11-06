# Banco

Postgres no Supabase. Migration em `supabase/migrations/20261105120000_init.sql`.

Tabelas: `settings`, `installment_plans`, `installments`, `cash_boxes`, `cash_box_movements`.

Todas têm `user_id` apontando para `auth.users`. RLS liga select, insert, update e delete somente quando `auth.uid() = user_id`.

Gravação por registro. O backup JSON `version: 1` é a única substituição completa, e só dos dados do usuário que importou.

Não usar a chave de serviço no front. Variáveis: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
