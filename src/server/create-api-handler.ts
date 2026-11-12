import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { CashBox } from '../domain/models/cash-box';
import type { CashBoxMovement } from '../domain/models/cash-box-movement';
import type { FreeBalanceDeposit } from '../domain/models/free-balance-deposit';
import type { FreeBalanceWithdrawal } from '../domain/models/free-balance-withdrawal';
import type { Installment } from '../domain/models/installment';
import type { InstallmentPlan } from '../domain/models/installment-plan';
import { createEmptySettings, type Settings } from '../domain/models/settings';
import {
  AccountKind,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  ensureSeededAccounts,
  normalizeLoginEmail,
} from './account-seed';
import { signAccessToken, verifyAccessToken } from './jwt';
import { hashPassword, verifyPassword } from './password';
import { schemaStatements } from './schema';
import {
  mapCashBox,
  mapFreeBalanceDeposit,
  mapFreeBalanceWithdrawal,
  mapInstallment,
  mapMovement,
  mapPlan,
  mapSettings,
  type Row,
} from './rows';
import {
  AUTH_RATE_RECOVER_EMAIL,
  AUTH_RATE_RECOVER_IP,
  AUTH_RATE_SIGN_IN_EMAIL,
  AUTH_RATE_SIGN_IN_IP,
} from '../domain/auth/auth-rate-limit-scopes';
import { formatLoginLockoutMessage } from '../domain/auth/login-lockout';
import { verifyTotpCode } from '../domain/auth/totp';
import {
  clearRateLimitKeys,
  loadRateLimitStates,
  rateLimitBlockedResponse,
  recordRateLimitFailures,
  type RateLimitKey,
} from './auth-rate-limit-flow';
import { totpBegin, totpDisable, totpEnable } from './auth-totp-routes';
import { demoBankSnapshot } from './demo-backup';
import { readClientIp } from './read-client-ip';
import { verifyTurnstileToken } from './turnstile';
import { DEMO_PERSISTENCE_ERROR, rejectsDemoPersistence } from './demo-persistence';
import { buildOpenApiDocument } from './openapi-document';
import {
  deleteCashBox,
  removeRow,
  replaceUserBackup,
  saveCashBox,
  saveInstallment,
  saveFreeBalanceDeposit,
  saveFreeBalanceWithdrawal,
  saveMovement,
  savePlan,
  saveSettings,
} from './user-backup';

import { ACCESS_TOKEN_TTL_SECONDS } from '../domain/auth/access-token-policy';
import { assertAppDataBackup } from '../domain/backup/assert-app-data-backup';
import { jsonResponse, withSecurityHeaders } from './security-response';

type Sql = NeonQueryFunction<false, false>;

type SessionUser = {
  id: string;
  email: string;
  mustChangePassword: boolean;
  isDemo: boolean;
};

const bootstrapReady = new Map<string, Promise<void>>();

type AuthSecurityOptions = {
  turnstileSecret?: string;
  turnstileSiteKey?: string;
};

export type ApiHandlerOptions = {
  databaseUrl?: string;
  jwtSecret?: string;
  turnstileSecret?: string;
  turnstileSiteKey?: string;
  /** Produção: só `true` liga POST /api/auth/recover. Dev costuma ligar por padrão no Vite. */
  passwordRecoverEnabled?: boolean;
};

export function createApiHandler(options: ApiHandlerOptions): (request: Request) => Promise<Response> {
  const authSecurity: AuthSecurityOptions = {
    turnstileSecret: options.turnstileSecret?.trim(),
    turnstileSiteKey: options.turnstileSiteKey?.trim(),
  };
  const passwordRecoverEnabled = options.passwordRecoverEnabled === true;
  return async (request) => {
    const databaseUrl = options.databaseUrl?.trim() || undefined;
    const jwtSecret = options.jwtSecret?.trim() || undefined;
    const url = new URL(request.url);

    if (url.pathname === '/api/openapi.json' && request.method === 'GET') {
      return withSecurityHeaders(
        new Response(JSON.stringify(buildOpenApiDocument(url.origin)), {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'cache-control': 'public, max-age=300',
          },
        }),
      );
    }

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return json({
        configured: Boolean(databaseUrl && jwtSecret),
        database: Boolean(databaseUrl),
        jwt: Boolean(jwtSecret),
      });
    }

    if (!databaseUrl || !jwtSecret) {
      return json({ configured: false, user: null, error: 'Servidor não configurado.' }, request.method === 'GET' ? 200 : 503);
    }
    try {
      const sql = neon(normalizeDatabaseUrl(databaseUrl));
      await ensureBootstrapped(databaseUrl, sql);
      return await route(sql, request, jwtSecret, authSecurity, passwordRecoverEnabled);
    } catch {
      return json({ error: 'Falha interna. Tente de novo.' }, 500);
    }
  };
}

async function route(
  sql: Sql,
  request: Request,
  jwtSecret: string,
  authSecurity: AuthSecurityOptions,
  passwordRecoverEnabled: boolean,
): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (pathname === '/api/auth/security' && request.method === 'GET') {
    return json({
      turnstileSiteKey: authSecurity.turnstileSiteKey ?? null,
      captchaRequired: Boolean(authSecurity.turnstileSecret),
      passwordRecoverEnabled,
    });
  }

  if (pathname === '/api/auth/session' && request.method === 'GET') {
    const user = await sessionUser(sql, jwtSecret, readBearerToken(request));
    return json({ configured: true, user });
  }
  if (pathname === '/api/auth/sign-up' && request.method === 'POST') {
    return json({ error: 'Cadastro fechado. Use uma conta existente.' }, 403);
  }
  if (pathname === '/api/auth/sign-in' && request.method === 'POST') {
    return signIn(sql, request, jwtSecret, authSecurity);
  }
  if (pathname === '/api/auth/sign-out' && request.method === 'POST') {
    return json({ ok: true });
  }
  if (pathname === '/api/auth/recover' && request.method === 'POST') {
    if (!passwordRecoverEnabled) {
      return json(
        {
          error:
            'Recuperação por e-mail desativada neste ambiente. Entre com sua senha ou peça a um administrador.',
        },
        403,
      );
    }
    return recoverPassword(sql, request, authSecurity);
  }
  if (pathname === '/api/auth/password' && request.method === 'POST') {
    return changePassword(sql, request, jwtSecret);
  }

  const account = await sessionUser(sql, jwtSecret, readBearerToken(request));
  if (pathname === '/api/auth/totp/status' && request.method === 'GET') {
    if (!account) {
      return json({ error: 'Entre na conta para continuar.' }, 401);
    }
    const rows = await sql`select totp_enabled from users where id = ${account.id}::uuid`;
    const enabled = Boolean((rows[0] as { totp_enabled?: boolean } | undefined)?.totp_enabled);
    return json({ enabled });
  }
  if (pathname === '/api/auth/totp/begin' && request.method === 'POST') {
    if (!account) {
      return json({ error: 'Entre na conta para continuar.' }, 401);
    }
    const body = (await request.json()) as { password?: string; code?: string };
    const result = await totpBegin(sql, account.id, {
      password: body.password,
      code: body.code,
    });
    if ('error' in result) {
      return json({ error: result.error }, 400);
    }
    return json(result);
  }
  if (pathname === '/api/auth/totp/enable' && request.method === 'POST') {
    if (!account) {
      return json({ error: 'Entre na conta para continuar.' }, 401);
    }
    const body = (await request.json()) as { code?: string };
    const result = await totpEnable(sql, account.id, String(body.code ?? ''));
    if ('error' in result) {
      return json({ error: result.error }, 400);
    }
    return json({ ok: true });
  }
  if (pathname === '/api/auth/totp/disable' && request.method === 'POST') {
    if (!account) {
      return json({ error: 'Entre na conta para continuar.' }, 401);
    }
    const body = (await request.json()) as { password?: string; code?: string };
    const result = await totpDisable(sql, account.id, String(body.password ?? ''), String(body.code ?? ''));
    if ('error' in result) {
      return json({ error: result.error }, 400);
    }
    return json({ ok: true });
  }

  if (!account) {
    return json({ error: 'Entre na conta para continuar.' }, 401);
  }
  if (account.mustChangePassword) {
    return json({ error: 'Defina uma nova senha para continuar.' }, 403);
  }
  if (rejectsDemoPersistence(account.isDemo, request.method, pathname)) {
    return json({ error: DEMO_PERSISTENCE_ERROR }, 403);
  }

  if (pathname === '/api/bank' && request.method === 'GET') {
    if (account.isDemo) {
      return json(demoBankSnapshot());
    }
    return json(await loadBank(sql, account.id));
  }
  if (pathname === '/api/bank/settings' && request.method === 'PUT') {
    await saveSettings(sql, account.id, (await request.json()) as Settings);
    return json({ ok: true });
  }
  if (pathname === '/api/bank/plans' && request.method === 'PUT') {
    await savePlan(sql, account.id, (await request.json()) as InstallmentPlan);
    return json({ ok: true });
  }
  if (pathname === '/api/bank/installments' && request.method === 'PUT') {
    await saveInstallment(sql, account.id, (await request.json()) as Installment);
    return json({ ok: true });
  }
  if (pathname === '/api/bank/cash-boxes' && request.method === 'PUT') {
    await saveCashBox(sql, account.id, (await request.json()) as CashBox);
    return json({ ok: true });
  }
  if (pathname === '/api/bank/movements' && request.method === 'PUT') {
    await saveMovement(sql, account.id, (await request.json()) as CashBoxMovement);
    return json({ ok: true });
  }
  if (pathname === '/api/bank/free-balance-deposits' && request.method === 'PUT') {
    const body = (await request.json()) as { deposit: FreeBalanceDeposit; settings: Settings };
    await saveFreeBalanceDeposit(sql, account.id, body.deposit, body.settings);
    return json({ ok: true });
  }
  if (pathname === '/api/bank/free-balance-withdrawals' && request.method === 'PUT') {
    const body = (await request.json()) as { withdrawal: FreeBalanceWithdrawal; settings: Settings };
    await saveFreeBalanceWithdrawal(sql, account.id, body.withdrawal, body.settings);
    return json({ ok: true });
  }
  if (pathname === '/api/bank/import' && request.method === 'POST') {
    const backup = assertAppDataBackup(await request.json());
    await replaceUserBackup(sql, account.id, backup);
    return json({ ok: true });
  }

  const planId = pathname.match(/^\/api\/bank\/plans\/([^/]+)$/);
  if (planId && request.method === 'DELETE') {
    await removeRow(sql, account.id, 'installment_plans', planId[1] ?? '');
    return json({ ok: true });
  }
  const installmentId = pathname.match(/^\/api\/bank\/installments\/([^/]+)$/);
  if (installmentId && request.method === 'DELETE') {
    await removeRow(sql, account.id, 'installments', installmentId[1] ?? '');
    return json({ ok: true });
  }
  const cashBoxId = pathname.match(/^\/api\/bank\/cash-boxes\/([^/]+)$/);
  if (cashBoxId && request.method === 'DELETE') {
    await deleteCashBox(sql, account.id, cashBoxId[1] ?? '');
    return json({ ok: true });
  }
  const movementId = pathname.match(/^\/api\/bank\/movements\/([^/]+)$/);
  if (movementId && request.method === 'DELETE') {
    await removeRow(sql, account.id, 'cash_box_movements', movementId[1] ?? '');
    return json({ ok: true });
  }
  return json({ error: 'Rota não encontrada.' }, 404);
}

async function signIn(
  sql: Sql,
  request: Request,
  jwtSecret: string,
  authSecurity: AuthSecurityOptions,
): Promise<Response> {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
    turnstileToken?: string;
    totpCode?: string;
  };
  const email = normalizeLoginEmail(String(body.email ?? ''));
  const password = String(body.password ?? '');
  const clientIp = readClientIp(request);

  if (!(await verifyTurnstileToken(authSecurity.turnstileSecret, body.turnstileToken, clientIp))) {
    return json({ error: 'Confirme o desafio de segurança (captcha) e tente de novo.' }, 400);
  }

  if (!email.includes('@') || (password.length < 6 && !(email === DEMO_EMAIL && password === DEMO_PASSWORD))) {
    return json({ error: 'Informe um e-mail válido e uma senha com pelo menos 6 caracteres.' }, 400);
  }

  const rateKeys: RateLimitKey[] = [
    { scope: AUTH_RATE_SIGN_IN_EMAIL, subject: email },
    { scope: AUTH_RATE_SIGN_IN_IP, subject: clientIp },
  ];
  const nowMs = Date.now();
  const rateStates = await loadRateLimitStates(sql, rateKeys);
  const blocked = rateLimitBlockedResponse(rateStates, nowMs, json);
  if (blocked) {
    return blocked;
  }

  const rows = await sql`
    select id, email, password_hash, account_kind, must_change_password, totp_secret, totp_enabled
    from users where email = ${email}
  `;
  const row = rows[0] as UserRow | undefined;
  const passwordOk = row ? await verifyPassword(password, row.password_hash) : false;
  if (!row || !passwordOk) {
    const worst = await recordRateLimitFailures(sql, rateKeys, nowMs);
    if (worst.locked) {
      return json(
        { error: formatLoginLockoutMessage(worst.retryAfterSeconds), retryAfterSeconds: worst.retryAfterSeconds },
        429,
        { 'retry-after': String(worst.retryAfterSeconds) },
      );
    }
    return json({ error: 'E-mail ou senha incorretos.' }, 400);
  }

  if (row.totp_enabled && row.totp_secret) {
    const totpCode = String(body.totpCode ?? '').trim();
    if (!verifyTotpCode(row.totp_secret, totpCode, nowMs)) {
      const worst = await recordRateLimitFailures(sql, rateKeys, nowMs);
      if (worst.locked) {
        return json(
          { error: formatLoginLockoutMessage(worst.retryAfterSeconds), retryAfterSeconds: worst.retryAfterSeconds },
          429,
          { 'retry-after': String(worst.retryAfterSeconds) },
        );
      }
      if (!totpCode) {
        return json({ error: 'Informe o código do autenticador.', requiresTotp: true }, 401);
      }
      return json({ error: 'Código 2FA inválido.', requiresTotp: true }, 401);
    }
  }

  await clearRateLimitKeys(sql, rateKeys);
  const id = String(row.id);
  return json({
    user: toSessionUser(row),
    accessToken: await issueAccessToken(jwtSecret, id, row.email),
  });
}

async function recoverPassword(sql: Sql, request: Request, authSecurity: AuthSecurityOptions): Promise<Response> {
  const body = (await request.json()) as { email?: string; newPassword?: string; turnstileToken?: string };
  const email = normalizeLoginEmail(String(body.email ?? ''));
  const newPassword = String(body.newPassword ?? '');
  const clientIp = readClientIp(request);

  if (!(await verifyTurnstileToken(authSecurity.turnstileSecret, body.turnstileToken, clientIp))) {
    return json({ error: 'Confirme o desafio de segurança (captcha) e tente de novo.' }, 400);
  }

  if (!email.includes('@') || newPassword.length < 6) {
    return json({ error: 'Informe o e-mail e uma nova senha com pelo menos 6 caracteres.' }, 400);
  }

  const rateKeys: RateLimitKey[] = [
    { scope: AUTH_RATE_RECOVER_EMAIL, subject: email },
    { scope: AUTH_RATE_RECOVER_IP, subject: clientIp },
  ];
  const nowMs = Date.now();
  const rateStates = await loadRateLimitStates(sql, rateKeys);
  const blocked = rateLimitBlockedResponse(rateStates, nowMs, json);
  if (blocked) {
    return blocked;
  }

  const rows = await sql`select id, account_kind from users where email = ${email}`;
  const row = rows[0] as { id: string; account_kind: string } | undefined;
  if (!row) {
    await recordRateLimitFailures(sql, rateKeys, nowMs);
    return json({ ok: true });
  }
  if (row.account_kind === AccountKind.Demo) {
    const worst = await recordRateLimitFailures(sql, rateKeys, nowMs);
    if (worst.locked) {
      return json(
        { error: formatLoginLockoutMessage(worst.retryAfterSeconds), retryAfterSeconds: worst.retryAfterSeconds },
        429,
        { 'retry-after': String(worst.retryAfterSeconds) },
      );
    }
    return json({ error: 'A conta de demonstração usa senha fixa.' }, 400);
  }
  await sql`
    update users
    set password_hash = ${await hashPassword(newPassword)}, must_change_password = false
    where id = ${String(row.id)}::uuid
  `;
  await clearRateLimitKeys(sql, rateKeys);
  return json({ ok: true });
}

async function changePassword(sql: Sql, request: Request, jwtSecret: string): Promise<Response> {
  const token = readBearerToken(request);
  if (!token) {
    return json({ error: 'Entre na conta para continuar.' }, 401);
  }
  let claims;
  try {
    claims = await verifyAccessToken(jwtSecret, token);
  } catch {
    return json({ error: 'Sessão inválida.' }, 401);
  }
  const body = (await request.json()) as { newPassword?: string; currentPassword?: string };
  const newPassword = String(body.newPassword ?? '');
  const currentPassword = String(body.currentPassword ?? '');
  if (newPassword.length < 6) {
    return json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, 400);
  }
  const rows = await sql`
    select id, email, account_kind, must_change_password, password_hash
    from users where id = ${claims.userId}::uuid
  `;
  const row = rows[0] as UserRow | undefined;
  if (!row) {
    return json({ error: 'Conta não encontrada.' }, 404);
  }
  if (row.account_kind === AccountKind.Demo) {
    return json({ error: 'A conta de demonstração usa senha fixa.' }, 400);
  }
  if (!row.must_change_password) {
    if (!currentPassword) {
      return json({ error: 'Informe a senha atual.' }, 400);
    }
    if (!(await verifyPassword(currentPassword, row.password_hash))) {
      return json({ error: 'Senha atual incorreta.' }, 400);
    }
  }
  await sql`
    update users
    set password_hash = ${await hashPassword(newPassword)}, must_change_password = false
    where id = ${claims.userId}::uuid
  `;
  return json({
    user: { ...toSessionUser(row), mustChangePassword: false },
    accessToken: await issueAccessToken(jwtSecret, claims.userId, row.email),
  });
}

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  account_kind: string;
  must_change_password: boolean;
  totp_secret?: string | null;
  totp_enabled?: boolean;
};

async function sessionUser(sql: Sql, jwtSecret: string, token: string | null): Promise<SessionUser | null> {
  if (!token) {
    return null;
  }
  try {
    const claims = await verifyAccessToken(jwtSecret, token);
    const rows = await sql`
      select id, email, account_kind, must_change_password
      from users where id = ${claims.userId}::uuid
    `;
    const row = rows[0] as UserRow | undefined;
    return row ? toSessionUser(row) : null;
  } catch {
    return null;
  }
}

function toSessionUser(row: UserRow): SessionUser {
  return {
    id: String(row.id),
    email: row.email,
    mustChangePassword: row.must_change_password,
    isDemo: row.account_kind === AccountKind.Demo,
  };
}

async function issueAccessToken(jwtSecret: string, userId: string, email: string): Promise<string> {
  return signAccessToken({ secret: jwtSecret, expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS }, { userId, email });
}

async function loadBank(sql: Sql, userId: string) {
  const results = await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`select * from settings where user_id = ${userId}::uuid`,
    sql`select * from installment_plans where user_id = ${userId}::uuid`,
    sql`select * from installments where user_id = ${userId}::uuid`,
    sql`select * from cash_boxes where user_id = ${userId}::uuid`,
    sql`select * from cash_box_movements where user_id = ${userId}::uuid`,
    sql`select * from free_balance_withdrawals where user_id = ${userId}::uuid`,
    sql`select * from free_balance_deposits where user_id = ${userId}::uuid`,
  ]);
  const settings = (results[1] as Row[])[0];
  return {
    settings: settings ? mapSettings(settings) : createEmptySettings(),
    installmentPlans: (results[2] as Row[]).map(mapPlan),
    installments: (results[3] as Row[]).map(mapInstallment),
    cashBoxes: (results[4] as Row[]).map(mapCashBox),
    cashBoxMovements: (results[5] as Row[]).map(mapMovement),
    freeBalanceWithdrawals: (results[6] as Row[]).map(mapFreeBalanceWithdrawal),
    freeBalanceDeposits: (results[7] as Row[]).map(mapFreeBalanceDeposit),
  };
}

function ensureBootstrapped(databaseUrl: string, sql: Sql): Promise<void> {
  const key = normalizeDatabaseUrl(databaseUrl);
  const existing = bootstrapReady.get(key);
  if (existing) {
    return existing;
  }
  const pending = (async () => {
    await sql.transaction(schemaStatements.map((statement) => sql.query(statement)));
    await ensureSeededAccounts(key, sql);
  })();
  bootstrapReady.set(key, pending);
  return pending;
}

function normalizeDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.delete('channel_binding');
  return url.toString();
}

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return jsonResponse(body, status, extraHeaders);
}

function readBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}
