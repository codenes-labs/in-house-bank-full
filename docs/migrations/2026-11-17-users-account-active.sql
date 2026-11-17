-- Conta ativa/inativa (SPEC-20). Idempotente.
alter table public.users add column if not exists account_active boolean not null default true;

update public.users set account_active = true where account_active is distinct from true;