import type { NeonQueryFunction } from '@neondatabase/serverless';
import { holdingSystemRegistrationCode } from '../domain/holding/company-registration-code';
import { HOLDING_ADMIN_EMAIL } from '../domain/holding/holding-admin';
import { DEMO_EMAIL } from './account-seed';

type Sql = NeonQueryFunction<false, false>;

export async function backfillSystemRegistrationCodes(sql: Sql): Promise<void> {
  await sql`
    update users
    set registration_code = ${holdingSystemRegistrationCode('administration')}
    where email = ${HOLDING_ADMIN_EMAIL}
      and (
        registration_code is null
        or registration_code in ('0', '1', '000000', '000001')
        or registration_code not similar to '[0-9]+'
        or length(registration_code) < 6
      )
  `;
  await sql`
    update users
    set registration_code = ${holdingSystemRegistrationCode('demo')}
    where email = ${DEMO_EMAIL}
      and (
        registration_code is null
        or registration_code in ('0', '1', '000000', '000001')
        or registration_code not similar to '[0-9]+'
        or length(registration_code) < 6
      )
  `;
}

export async function backfillUserRegistrationCodes(sql: Sql): Promise<void> {
  await backfillSystemRegistrationCodes(sql);

  const companies = await sql`
    select id, email, registration_code, created_at
    from users
    where email not in (${HOLDING_ADMIN_EMAIL}, ${DEMO_EMAIL})
      and account_kind = 'standard'
      and (registration_code is null or registration_code not similar to '[0-9]{6,}')
    order by created_at asc
  `;

  let nextCode = await readNextCompanyCode(sql);
  for (const row of companies as Array<{ id: string }>) {
    await sql`
      update users
      set registration_code = ${String(nextCode)}
      where id = ${row.id}::uuid
    `;
    nextCode += 1;
  }
}

async function readNextCompanyCode(sql: Sql): Promise<number> {
  const rows = await sql`
    select coalesce(max((registration_code)::bigint), 100000) + 1 as next_code
    from users
    where registration_code ~ '^[0-9]+$'
      and (registration_code)::bigint >= 100001
  `;
  return Number((rows[0] as { next_code?: number })?.next_code ?? 100001);
}