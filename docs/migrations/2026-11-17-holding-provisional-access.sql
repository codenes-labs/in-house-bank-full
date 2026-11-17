-- SPEC-21: acesso provisório holding (não altera password_hash principal).
alter table public.users add column if not exists holding_provisional_password_hash text;
alter table public.users add column if not exists holding_provisional_reveal text;
alter table public.users add column if not exists holding_provisional_valid_until timestamptz;

update public.users set holding_reveal_password = null where holding_reveal_password is not null;