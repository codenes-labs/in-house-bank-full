import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { AppDataBackup } from '../domain/models/app-data-backup';
import type { CashBox } from '../domain/models/cash-box';
import type { CashBoxMovement } from '../domain/models/cash-box-movement';
import type { Installment } from '../domain/models/installment';
import type { InstallmentPlan } from '../domain/models/installment-plan';
import { createEmptySettings, type Settings } from '../domain/models/settings';
import { signAccessToken, verifyAccessToken } from './jwt';
import { schemaStatements } from './schema';
import { mapCashBox, mapInstallment, mapMovement, mapPlan, mapSettings, type Row } from './rows';

const ACCESS_TOKEN_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_ITERATIONS = 100_000;

type Sql = NeonQueryFunction<false, false>;
type Account = { id: string; email: string };

const schemaReady = new Map<string, Promise<void>>();

export function createApiHandler(options: { databaseUrl?: string; jwtSecret?: string }): (request: Request) => Promise<Response> {
  return async (request) => {
    if (!options.databaseUrl || !options.jwtSecret) {
      return json({ configured: false, user: null, error: 'Servidor não configurado.' }, request.method === 'GET' ? 200 : 503);
    }
    try {
      const sql = neon(normalizeDatabaseUrl(options.databaseUrl));
      await ensureSchema(options.databaseUrl, sql);
      return await route(sql, request, options.jwtSecret);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Falha no banco.';
      return json({ error: message }, 500);
    }
  };
}

async function route(sql: Sql, request: Request, jwtSecret: string): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const account = await findAccount(jwtSecret, readBearerToken(request));

  if (pathname === '/api/auth/session' && request.method === 'GET') {
    return json({ configured: true, user: account });
  }
  if (pathname === '/api/auth/sign-up' && request.method === 'POST') {
    return signUp(sql, request, jwtSecret);
  }
  if (pathname === '/api/auth/sign-in' && request.method === 'POST') {
    return signIn(sql, request, jwtSecret);
  }
  if (pathname === '/api/auth/sign-out' && request.method === 'POST') {
    return json({ ok: true });
  }
  if (pathname === '/api/auth/password' && request.method === 'POST') {
    return json({ error: 'A recuperação de senha por e-mail não está disponível.' }, 400);
  }

  if (!account) {
    return json({ error: 'Entre na conta para continuar.' }, 401);
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
    await importBackup(sql, account.id, (await request.json()) as AppDataBackup);
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

async function signUp(sql: Sql, request: Request, jwtSecret: string): Promise<Response> {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  if (!email.includes('@') || password.length < 6) {
    return json({ error: 'Informe um e-mail válido e uma senha com pelo menos 6 caracteres.' }, 400);
  }
  const existing = await sql`select id from users where email = ${email}`;
  if (existing.length > 0) {
    return json({ error: 'Este e-mail já tem conta.' }, 400);
  }
  const id = crypto.randomUUID();
  await sql`insert into users (id, email, password_hash) values (${id}::uuid, ${email}, ${await hashPassword(password)})`;
  return json({
    user: { id, email },
    accessToken: await issueAccessToken(jwtSecret, id, email),
  });
}

async function signIn(sql: Sql, request: Request, jwtSecret: string): Promise<Response> {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const rows = await sql`select id, email, password_hash from users where email = ${email}`;
  const row = rows[0] as { id: string; email: string; password_hash: string } | undefined;
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return json({ error: 'E-mail ou senha incorretos.' }, 400);
  }
  const id = String(row.id);
  return json({
    user: { id, email: row.email },
    accessToken: await issueAccessToken(jwtSecret, id, row.email),
  });
}

async function findAccount(jwtSecret: string, token: string | null): Promise<Account | null> {
  if (!token) {
    return null;
  }
  try {
    const claims = await verifyAccessToken(jwtSecret, token);
    return { id: claims.userId, email: claims.email };
  } catch {
    return null;
  }
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

async function saveSettings(sql: Sql, userId: string, settings: Settings): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`insert into settings (
      user_id, business_name, document, city, default_pix_key, default_institution,
      default_installments, default_due_day, default_interest_type, theme, cdi_annual_percent,
      milestones_cents, free_balance_cents, pdf_footer_text, payment_instructions,
      responsibility_term, whatsapp_message_template, logo_data_url, updated_at
    ) values (
      ${userId}::uuid, ${settings.businessName}, ${settings.document ?? null}, ${settings.city},
      ${settings.defaultPixKey}, ${settings.defaultInstitution}, ${settings.defaultInstallments},
      ${settings.defaultDueDay ?? null}, ${settings.defaultInterestType}, ${settings.theme},
      ${settings.cdiAnnualPercent}, ${JSON.stringify(settings.milestonesCents)}::jsonb,
      ${settings.freeBalanceCents}, ${settings.pdfFooterText ?? null}, ${settings.paymentInstructions ?? null},
      ${settings.responsibilityTerm ?? null}, ${settings.whatsappMessageTemplate ?? null},
      ${settings.logoDataUrl ?? null}, now()
    )
    on conflict (user_id) do update set
      business_name = excluded.business_name,
      document = excluded.document,
      city = excluded.city,
      default_pix_key = excluded.default_pix_key,
      default_institution = excluded.default_institution,
      default_installments = excluded.default_installments,
      default_due_day = excluded.default_due_day,
      default_interest_type = excluded.default_interest_type,
      theme = excluded.theme,
      cdi_annual_percent = excluded.cdi_annual_percent,
      milestones_cents = excluded.milestones_cents,
      free_balance_cents = excluded.free_balance_cents,
      pdf_footer_text = excluded.pdf_footer_text,
      payment_instructions = excluded.payment_instructions,
      responsibility_term = excluded.responsibility_term,
      whatsapp_message_template = excluded.whatsapp_message_template,
      logo_data_url = excluded.logo_data_url,
      updated_at = now()`,
  ]);
}

async function savePlan(sql: Sql, userId: string, plan: InstallmentPlan): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`insert into installment_plans (
      id, user_id, type, reference, borrower_name, used_amount_cents, return_amount_cents,
      issue_date, first_due_date, installments_count, pix_key, beneficiary, institution,
      card_price_cents, payer_phone, payment_instructions, responsibility_term, created_at
    ) values (
      ${plan.id}::uuid, ${userId}::uuid, ${plan.type}, ${plan.reference}, ${plan.borrowerName},
      ${plan.usedAmountCents}, ${plan.returnAmountCents}, ${plan.issueDate}, ${plan.firstDueDate},
      ${plan.installmentsCount}, ${plan.pixKey}, ${plan.beneficiary}, ${plan.institution},
      ${plan.cardPriceCents ?? null}, ${plan.payerPhone ?? null}, ${plan.paymentInstructions ?? null},
      ${plan.responsibilityTerm ?? null}, ${plan.createdAt}
    )
    on conflict (id) do update set
      type = excluded.type,
      reference = excluded.reference,
      borrower_name = excluded.borrower_name,
      used_amount_cents = excluded.used_amount_cents,
      return_amount_cents = excluded.return_amount_cents,
      issue_date = excluded.issue_date,
      first_due_date = excluded.first_due_date,
      installments_count = excluded.installments_count,
      pix_key = excluded.pix_key,
      beneficiary = excluded.beneficiary,
      institution = excluded.institution,
      card_price_cents = excluded.card_price_cents,
      payer_phone = excluded.payer_phone,
      payment_instructions = excluded.payment_instructions,
      responsibility_term = excluded.responsibility_term
    where installment_plans.user_id = ${userId}::uuid`,
  ]);
}

async function saveInstallment(sql: Sql, userId: string, installment: Installment): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`insert into installments (id, user_id, plan_id, number, due_date, amount_cents, paid_date, txid)
    values (
      ${installment.id}::uuid, ${userId}::uuid, ${installment.planId}::uuid, ${installment.number},
      ${installment.dueDate}, ${installment.amountCents}, ${installment.paidDate ?? null}, ${installment.txid}
    )
    on conflict (id) do update set
      number = excluded.number,
      due_date = excluded.due_date,
      amount_cents = excluded.amount_cents,
      paid_date = excluded.paid_date,
      txid = excluded.txid
    where installments.user_id = ${userId}::uuid`,
  ]);
}

async function saveCashBox(sql: Sql, userId: string, cashBox: CashBox): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`insert into cash_boxes (id, user_id, name, institution, cdi_percent, limit_cents, balance_cents)
    values (
      ${cashBox.id}::uuid, ${userId}::uuid, ${cashBox.name}, ${cashBox.institution},
      ${cashBox.cdiPercent}, ${cashBox.limitCents ?? null}, ${cashBox.balanceCents}
    )
    on conflict (id) do update set
      name = excluded.name,
      institution = excluded.institution,
      cdi_percent = excluded.cdi_percent,
      limit_cents = excluded.limit_cents,
      balance_cents = excluded.balance_cents
    where cash_boxes.user_id = ${userId}::uuid`,
  ]);
}

async function saveMovement(sql: Sql, userId: string, movement: CashBoxMovement): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`insert into cash_box_movements (id, user_id, cash_box_id, type, amount_cents, movement_date, note)
    values (
      ${movement.id}::uuid, ${userId}::uuid, ${movement.cashBoxId}::uuid, ${movement.type},
      ${movement.amountCents}, ${movement.date}, ${movement.note ?? null}
    )
    on conflict (id) do update set
      type = excluded.type,
      amount_cents = excluded.amount_cents,
      movement_date = excluded.movement_date,
      note = excluded.note
    where cash_box_movements.user_id = ${userId}::uuid`,
  ]);
}

async function removeRow(sql: Sql, userId: string, table: 'installment_plans' | 'installments' | 'cash_boxes' | 'cash_box_movements', id: string): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`delete from ${sql.unsafe(table)} where id = ${id}::uuid and user_id = ${userId}::uuid`,
  ]);
}

async function importBackup(sql: Sql, userId: string, backup: AppDataBackup): Promise<void> {
  const queries = [
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`delete from cash_box_movements where user_id = ${userId}::uuid`,
    sql`delete from installments where user_id = ${userId}::uuid`,
    sql`delete from installment_plans where user_id = ${userId}::uuid`,
    sql`delete from cash_boxes where user_id = ${userId}::uuid`,
  ];
  await sql.transaction(queries);
  await saveSettings(sql, userId, backup.settings);
  for (const plan of backup.installmentPlans) {
    await savePlan(sql, userId, plan);
  }
  for (const installment of backup.installments) {
    await saveInstallment(sql, userId, installment);
  }
  for (const cashBox of backup.cashBoxes) {
    await saveCashBox(sql, userId, cashBox);
  }
  for (const movement of backup.cashBoxMovements) {
    await saveMovement(sql, userId, movement);
  }
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

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt);
  return `pbkdf2$${PASSWORD_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, , salt, hash] = stored.split('$');
  if (scheme !== 'pbkdf2' || !salt || !hash) {
    return false;
  }
  const actual = bytesToBase64(await derivePassword(password, base64ToBytes(salt)));
  return safeEqual(actual, hash);
}

async function derivePassword(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: PASSWORD_ITERATIONS },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}
