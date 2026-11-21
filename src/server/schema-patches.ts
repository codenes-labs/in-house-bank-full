import type { NeonQueryFunction } from '@neondatabase/serverless';
import {
  backfillSystemRegistrationCodes,
  backfillUserRegistrationCodes,
} from './backfill-user-registration-codes';

type Sql = NeonQueryFunction<false, false>;

/** Migrações idempotentes após o bootstrap inicial (dev com DB já criado). */
export async function ensureSchemaPatches(sql: Sql): Promise<void> {
  await sql.query(`alter table public.users add column if not exists registration_code text`);
  await sql.query(
    `create unique index if not exists users_registration_code_key on public.users (registration_code) where registration_code is not null`,
  );
  await sql.query(`alter table public.users add column if not exists holding_delegate boolean not null default false`);
  await sql.query(
    `alter table public.users add column if not exists menu_access jsonb not null default '{"patrimonio":true,"holding":false,"relatorios":true,"conta":true}'::jsonb`,
  );
  await sql.query(`alter table public.users add column if not exists holding_reveal_password text`);
  await sql.query(
    `alter table public.users add column if not exists account_active boolean not null default true`,
  );
  await sql.query(`alter table public.users add column if not exists holding_provisional_password_hash text`);
  await sql.query(`alter table public.users add column if not exists holding_provisional_reveal text`);
  await sql.query(`alter table public.users add column if not exists holding_provisional_valid_until timestamptz`);
  await sql.query(`update public.users set holding_reveal_password = null where holding_reveal_password is not null`);
  await backfillSystemRegistrationCodes(sql);
  const pending = await sql`
    select 1
    from users
    where registration_code is null
    limit 1
  `;
  if (pending.length > 0) {
    await backfillUserRegistrationCodes(sql);
  }

  await sql.query(`
    create table if not exists public.waitlist_signups (
      id uuid primary key,
      name text not null,
      email text not null,
      interest text not null,
      message text,
      consent_given boolean not null default false,
      source text not null default 'direct',
      created_at timestamptz not null default now()
    )
  `);
  await sql.query(`
    create unique index if not exists waitlist_signups_email_lower_key
      on public.waitlist_signups (lower(email))
  `);
  await sql.query(`
    create index if not exists waitlist_signups_created_at_idx
      on public.waitlist_signups (created_at desc)
  `);
}