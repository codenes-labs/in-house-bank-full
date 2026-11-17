import type { NeonQueryFunction } from '@neondatabase/serverless';
import { DEMO_EMAIL, normalizeLoginEmail, AccountKind, ADMIN_EMAIL } from './account-seed';
import { allocateCompanyRegistrationCode } from './allocate-company-registration-code';
import { hashPassword } from './password';

type Sql = NeonQueryFunction<false, false>;

export type ProvisionStandardAccountError = {
  error: string;
  status: 400;
};

export type ProvisionStandardAccountSuccess = {
  userId: string;
  email: string;
  registrationCode: string;
};

export type ProvisionStandardAccountResult = ProvisionStandardAccountSuccess | ProvisionStandardAccountError;

export function validateStandardAccountCredentials(
  rawEmail: string,
  password: string,
): { email: string } | ProvisionStandardAccountError {
  const email = normalizeLoginEmail(rawEmail);
  if (!email.includes('@') || password.length < 6) {
    return {
      error: 'Informe um e-mail válido e uma senha com pelo menos 6 caracteres.',
      status: 400,
    };
  }
  if (email === ADMIN_EMAIL || email === DEMO_EMAIL) {
    return { error: 'Este e-mail não pode ser usado no cadastro.', status: 400 };
  }
  return { email };
}

export async function provisionStandardAccount(
  sql: Sql,
  rawEmail: string,
  password: string,
): Promise<ProvisionStandardAccountResult> {
  const validated = validateStandardAccountCredentials(rawEmail, password);
  if ('error' in validated) {
    return validated;
  }
  const { email } = validated;

  const existing = await sql`select id from users where email = ${email}`;
  if (existing.length > 0) {
    return { error: 'Este e-mail já está em uso.', status: 400 };
  }

  const userId = crypto.randomUUID();
  const registrationCode = await allocateCompanyRegistrationCode(sql);
  const passwordHash = await hashPassword(password);
  await sql`
    insert into users (id, email, password_hash, account_kind, must_change_password, registration_code)
    values (
      ${userId}::uuid,
      ${email},
      ${passwordHash},
      ${AccountKind.Standard},
      false,
      ${registrationCode}
    )
  `;

  return { userId, email, registrationCode };
}