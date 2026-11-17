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
}