import { describe, expect, it } from 'vitest';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { hashPassword } from './password';
import { AccountKind } from './account-seed';
import { totpBegin } from './auth-totp-routes';
import { TOTP } from 'otpauth';
import { verifyTotpCode } from '../domain/auth/totp';

type Sql = NeonQueryFunction<false, false>;

describe('totpBegin', () => {
  it('rejects when 2FA is enabled without password and code', async () => {
    const sql = createMockSql({
      id: '11111111-1111-4111-8111-111111111111',
      email: 'user@example.com',
      password_hash: await hashPassword('senha-antiga'),
      account_kind: AccountKind.Standard,
      totp_secret: 'SECRETBASE32',
      totp_enabled: true,
    });
    const result = await totpBegin(sql, '11111111-1111-4111-8111-111111111111');
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('2FA ativo');
    }
  });

  it('allows rotation when 2FA is enabled with password and valid code', async () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const totp = new TOTP({ secret, digits: 6, period: 30 });
    const code = totp.generate();
    const row = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'user@example.com',
      password_hash: await hashPassword('senha-antiga'),
      account_kind: AccountKind.Standard,
      totp_secret: secret,
      totp_enabled: true,
    };
    let updated: { totp_enabled: boolean; totp_secret: string | null } | null = null;
    const sql = createMockSql(row, (patch) => {
      updated = patch;
    });
    const result = await totpBegin(sql, row.id, { password: 'senha-antiga', code });
    expect('secret' in result).toBe(true);
    expect(verifyTotpCode(secret, code)).toBe(true);
    expect(updated).toEqual(
      expect.objectContaining({ totp_enabled: false, totp_secret: expect.not.stringMatching(secret) }),
    );
  });
});

function createMockSql(
  row: {
    id: string;
    email: string;
    password_hash: string;
    account_kind: string;
    totp_secret: string | null;
    totp_enabled: boolean;
  },
  onUpdate?: (patch: { totp_enabled: boolean; totp_secret: string | null }) => void,
): Sql {
  const fn = Object.assign(
    async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const text = strings.reduce((acc, part, index) => acc + part + (values[index] ?? ''), '');
      if (text.includes('select') && text.includes('from users')) {
        return [row];
      }
      if (text.includes('update users')) {
        const secret = values[0] as string;
        onUpdate?.({ totp_secret: secret, totp_enabled: false });
        row.totp_secret = secret;
        row.totp_enabled = false;
        return [];
      }
      return [];
    },
    {
      query: async () => [],
      unsafe: (value: string) => value,
      transaction: async (queries: Promise<unknown>[]) => {
        await Promise.all(queries);
      },
    },
  ) as unknown as Sql;
  return fn;
}
