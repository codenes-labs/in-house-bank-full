import type { NeonQueryFunction } from '@neondatabase/serverless';
import { createId } from '../domain/ids/create-id';
import type { ValidatedWaitlistSignup } from '../domain/waitlist/validate-waitlist-signup';

type Sql = NeonQueryFunction<false, false>;

export type WaitlistSignupRow = {
  id: string;
  name: string;
  email: string;
  interest: string;
  message: string | null;
  consent_given: boolean;
  source: string;
  created_at: string | Date;
};

export async function insertWaitlistSignup(sql: Sql, input: ValidatedWaitlistSignup): Promise<'created' | 'exists'> {
  const existing = await sql`
    select 1 as found
    from waitlist_signups
    where lower(email) = lower(${input.email})
    limit 1
  `;
  if (existing.length > 0) {
    return 'exists';
  }

  const id = createId();
  await sql`
    insert into waitlist_signups (id, name, email, interest, message, consent_given, source)
    values (
      ${id}::uuid,
      ${input.name},
      ${input.email},
      ${input.interest},
      ${input.message},
      true,
      ${input.source}
    )
  `;
  return 'created';
}

export async function listWaitlistSignups(sql: Sql): Promise<WaitlistSignupRow[]> {
  const rows = await sql`
    select id, name, email, interest, message, consent_given, source, created_at
    from waitlist_signups
    order by created_at desc
    limit 500
  `;
  return rows as WaitlistSignupRow[];
}