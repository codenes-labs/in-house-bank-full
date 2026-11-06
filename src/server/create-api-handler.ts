import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { AppDataBackup } from '../domain/models/app-data-backup';
import type { CashBox } from '../domain/models/cash-box';
import type { CashBoxMovement } from '../domain/models/cash-box-movement';
import type { Installment } from '../domain/models/installment';
import type { InstallmentPlan } from '../domain/models/installment-plan';
import { createEmptySettings, type Settings } from '../domain/models/settings';
import {
  AccountKind,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  ensureSeededAccounts,
  normalizeLoginEmail,
  restoreDemoSnapshot,
} from './account-seed';
import { signAccessToken, verifyAccessToken } from './jwt';
import { hashPassword, verifyPassword } from './password';
import { schemaStatements } from './schema';
import { mapCashBox, mapInstallment, mapMovement, mapPlan, mapSettings, type Row } from './rows';
import {
  removeRow,
  replaceUserBackup,
  saveCashBox,
  saveInstallment,
  saveMovement,
  savePlan,
  saveSettings,
} from './user-backup';

const ACCESS_TOKEN_SECONDS = 60 * 60 * 24 * 30;

type Sql = NeonQueryFunction<false, false>;

type SessionUser = {
  id: string;
  email: string;
  mustChangePassword: boolean;
  isDemo: boolean;
};

const schemaReady = new Map<string, Promise<void>>();

export function createApiHandler(options: { databaseUrl?: string; jwtSecret?: string }): (request: Request) => Promise<Response> {
  return async (request) => {
    const databaseUrl = options.databaseUrl?.trim() || undefined;
    const jwtSecret = options.jwtSecret?.trim() || undefined;
    const url = new URL(request.url);

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
      await ensureSchema(databaseUrl, sql);
      await ensureSeededAccounts(sql);
      return await route(sql, request, jwtSecret);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Falha no banco.';
      return json({ error: message }, 500);
    }
  };
}

async function route(sql: Sql, request: Request, jwtSecret: string): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (pathname === '/api/auth/session' && request.method === 'GET') {
    const user = await sessionUser(sql, jwtSecret, readBearerToken(request));
    return json({ configured: true, user });
  }
  if (pathname === '/api/auth/sign-up' && request.method === 'POST') {
    return json({ error: 'Cadastro fechado. Use uma conta existente.' }, 403);
  }
  if (pathname === '/api/auth/sign-in' && request.method === 'POST') {
    return signIn(sql, request, jwtSecret);
  }
  if (pathname === '/api/auth/sign-out' && request.method === 'POST') {
    return json({ ok: true });
  }
  if (pathname === '/api/auth/recover' && request.method === 'POST') {
    return recoverPassword(sql, request);
  }
  if (pathname === '/api/auth/password' && request.method === 'POST') {
    return changePassword(sql, request, jwtSecret);
  }

  const account = await sessionUser(sql, jwtSecret, readBearerToken(request));
  if (!account) {
    return json({ error: 'Entre na conta para continuar.' }, 401);
  }
  if (account.mustChangePassword) {
    return json({ error: 'Defina uma nova senha para continuar.' }, 403);
  }

  if (pathname === '/api/bank' && request.method === 'GET') {
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
  if (pathname === '/api/bank/import' && request.method === 'POST') {
    await replaceUserBackup(sql, account.id, (await request.json()) as AppDataBackup);
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
    await removeRow(sql, account.id, 'cash_boxes', cashBoxId[1] ?? '');
    return json({ ok: true });
  }
  const movementId = pathname.match(/^\/api\/bank\/movements\/([^/]+)$/);
  if (movementId && request.method === 'DELETE') {
    await removeRow(sql, account.id, 'cash_box_movements', movementId[1] ?? '');
    return json({ ok: true });
  }
  return json({ error: 'Rota não encontrada.' }, 404);
}

async function signIn(sql: Sql, request: Request, jwtSecret: string): Promise<Response> {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = normalizeLoginEmail(String(body.email ?? ''));
  const password = String(body.password ?? '');
  if (!email.includes('@') || (password.length < 6 && !(email === DEMO_EMAIL && password === DEMO_PASSWORD))) {
    return json({ error: 'Informe um e-mail válido e uma senha com pelo menos 6 caracteres.' }, 400);
  }
  const rows = await sql`
    select id, email, password_hash, account_kind, must_change_password
    from users where email = ${email}
  `;
  const row = rows[0] as UserRow | undefined;
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return json({ error: 'E-mail ou senha incorretos.' }, 400);
  }
  const id = String(row.id);
  if (row.account_kind === AccountKind.Demo) {
    await restoreDemoSnapshot(sql, id);
  }
  return json({
    user: toSessionUser(row),
    accessToken: await issueAccessToken(jwtSecret, id, row.email),
  });
}

async function recoverPassword(sql: Sql, request: Request): Promise<Response> {
  const body = (await request.json()) as { email?: string; newPassword?: string };
  const email = normalizeLoginEmail(String(body.email ?? ''));
  const newPassword = String(body.newPassword ?? '');
  if (!email.includes('@') || newPassword.length < 6) {
    return json({ error: 'Informe o e-mail e uma nova senha com pelo menos 6 caracteres.' }, 400);
  }
  const rows = await sql`select id, account_kind from users where email = ${email}`;
  const row = rows[0] as { id: string; account_kind: string } | undefined;
  if (!row) {
    return json({ ok: true });
  }
  if (row.account_kind === AccountKind.Demo) {
    return json({ error: 'A conta de demonstração usa senha fixa.' }, 400);
  }
  await sql`
    update users
    set password_hash = ${await hashPassword(newPassword)}, must_change_password = false
    where id = ${String(row.id)}::uuid
  `;
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
  const body = (await request.json()) as { newPassword?: string };
  const newPassword = String(body.newPassword ?? '');
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
  return signAccessToken({ secret: jwtSecret, expiresInSeconds: ACCESS_TOKEN_SECONDS }, { userId, email });
}

async function loadBank(sql: Sql, userId: string) {
  const results = await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`select * from settings where user_id = ${userId}::uuid`,
    sql`select * from installment_plans where user_id = ${userId}::uuid`,
    sql`select * from installments where user_id = ${userId}::uuid`,
    sql`select * from cash_boxes where user_id = ${userId}::uuid`,
    sql`select * from cash_box_movements where user_id = ${userId}::uuid`,
  ]);
  const settings = (results[1] as Row[])[0];
  return {
    settings: settings ? mapSettings(settings) : createEmptySettings(),
    installmentPlans: (results[2] as Row[]).map(mapPlan),
    installments: (results[3] as Row[]).map(mapInstallment),
    cashBoxes: (results[4] as Row[]).map(mapCashBox),
    cashBoxMovements: (results[5] as Row[]).map(mapMovement),
  };
}

function ensureSchema(databaseUrl: string, sql: Sql): Promise<void> {
  const existing = schemaReady.get(databaseUrl);
  if (existing) {
    return existing;
  }
  const pending = (async () => {
    for (const statement of schemaStatements) {
      await sql.query(statement);
    }
  })();
  schemaReady.set(databaseUrl, pending);
  return pending;
}

function normalizeDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.delete('channel_binding');
  return url.toString();
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function readBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}
