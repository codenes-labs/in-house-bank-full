import type { NeonQueryFunction } from '@neondatabase/serverless';
import { AUTH_RATE_WAITLIST_IP } from '../domain/auth/auth-rate-limit-scopes';
import { formatLoginLockoutMessage } from '../domain/auth/login-lockout';
import { validateWaitlistSignup } from '../domain/waitlist/validate-waitlist-signup';
import {
  clearRateLimitKeys,
  loadRateLimitStates,
  rateLimitBlockedResponse,
  recordRateLimitFailures,
  type RateLimitKey,
} from './auth-rate-limit-flow';
import { readClientIp } from './read-client-ip';
import { verifyTurnstileToken } from './turnstile';
import { insertWaitlistSignup } from './waitlist-signups';

type Sql = NeonQueryFunction<false, false>;

type AuthSecurityOptions = {
  turnstileSecret?: string;
};

export async function postWaitlist(
  sql: Sql,
  request: Request,
  authSecurity: AuthSecurityOptions,
  json: (body: unknown, status?: number, extraHeaders?: Record<string, string>) => Response,
): Promise<Response> {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    interest?: string;
    message?: string;
    consentGiven?: boolean;
    source?: string;
    turnstileToken?: string;
  };

  const clientIp = readClientIp(request);
  const rateKeys: RateLimitKey[] = [{ scope: AUTH_RATE_WAITLIST_IP, subject: clientIp }];
  const nowMs = Date.now();

  const [captchaOk, rateStates] = await Promise.all([
    verifyTurnstileToken(authSecurity.turnstileSecret, body.turnstileToken, clientIp),
    loadRateLimitStates(sql, rateKeys),
  ]);

  if (authSecurity.turnstileSecret && !captchaOk) {
    return json({ error: 'Confirme o desafio de segurança (captcha) e tente de novo.' }, 400);
  }

  const blocked = rateLimitBlockedResponse(rateStates, nowMs, json);
  if (blocked) {
    return blocked;
  }

  const parsed = validateWaitlistSignup({
    name: String(body.name ?? ''),
    email: String(body.email ?? ''),
    interest: String(body.interest ?? ''),
    message: body.message,
    consentGiven: body.consentGiven === true,
    source: body.source,
  });

  if (!parsed.ok) {
    const worst = await recordRateLimitFailures(sql, rateKeys, nowMs);
    if (worst.locked) {
      return json(
        { error: formatLoginLockoutMessage(worst.retryAfterSeconds), retryAfterSeconds: worst.retryAfterSeconds },
        429,
        { 'retry-after': String(worst.retryAfterSeconds) },
      );
    }
    return json({ error: parsed.error }, 400);
  }

  const result = await insertWaitlistSignup(sql, parsed.value);
  await clearRateLimitKeys(sql, rateKeys);

  if (result === 'has_account') {
    return json(
      {
        error:
          'Este e-mail já tem conta no In House Bank. A lista de espera é só para quem ainda não entrou no app.',
        existingAccount: true,
      },
      400,
    );
  }

  if (result === 'exists') {
    return json({
      ok: true,
      alreadyOnWaitlist: true,
      message: 'Este e-mail já está na lista de espera. Você não precisa cadastrar de novo — avisaremos por e-mail quando houver novidades.',
    });
  }

  return json({
    ok: true,
    alreadyOnWaitlist: false,
    message: 'Cadastro recebido. Entraremos em contato por e-mail.',
  });
}