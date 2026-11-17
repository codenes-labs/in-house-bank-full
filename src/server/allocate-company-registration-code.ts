import type { NeonQueryFunction } from '@neondatabase/serverless';
import { HOLDING_COMPANY_REGISTRATION_START } from '../domain/holding/company-registration-code';

type Sql = NeonQueryFunction<false, false>;

export async function allocateCompanyRegistrationCode(sql: Sql): Promise<string> {
  const rows = await sql`
    select coalesce(max((registration_code)::bigint), ${HOLDING_COMPANY_REGISTRATION_START - 1}) + 1 as next_code
    from users
    where registration_code ~ '^[0-9]+$'
      and (registration_code)::bigint >= ${HOLDING_COMPANY_REGISTRATION_START}
  `;
  const next = rows[0] as { next_code?: number | string } | undefined;
  const value = Number(next?.next_code ?? HOLDING_COMPANY_REGISTRATION_START);
  return String(value);
}