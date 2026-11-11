# SPEC-13 Proteção de autenticação

Status: concluída.

## Objetivo

Proteger login, recuperação de senha e contas com tentativas limitadas, captcha quando configurado e TOTP opcional.

## Regras

### Rate limit (e-mail e IP)

1. Escopos: `sign-in:email`, `sign-in:ip`, `recover:email`, `recover:ip` na tabela `auth_rate_limits`.
2. Mesmas regras de falhas e bloqueio progressivo (5 falhas → 15 / 30 / 60 / 120 min).
3. IP lido de `cf-connecting-ip`, `x-forwarded-for` (primeiro hop) ou `x-real-ip`; sem header → assunto `unknown`.
4. Login bem-sucedido limpa limites de **sign-in** do e-mail e do IP; recuperação bem-sucedida limpa limites de **recover**.
5. Recuperação com e-mail inexistente ainda conta falha (resposta `ok: true` para não enumerar contas).

### Captcha (Cloudflare Turnstile)

6. Variáveis `TURNSTILE_SECRET_KEY` e `TURNSTILE_SITE_KEY`. Sem secret, captcha **desligado** (desenvolvimento).
7. Com secret, `sign-in` e `recover` exigem `turnstileToken` válido.
8. `GET /api/auth/security` informa `captchaRequired` e `turnstileSiteKey` ao cliente.

### 2FA (TOTP)

9. Colunas `users.totp_secret`, `users.totp_enabled`.
10. Configuração em **Configurações → Usuário**: `POST /api/auth/totp/begin`, `enable`, `disable` (com senha + código).
11. Login: após senha correta, se `totp_enabled`, exige `totpCode` (6 dígitos, janela ±1 período).
12. Falhas de TOTP contam no rate limit de sign-in.

## Aceite

1. Testes em `login-lockout.spec.ts`, `rate-limit-subjects` (via `worstRateLimitLock`), `totp.spec.ts`, `read-client-ip.spec.ts`.
2. UI: captcha em `/entrar` e `/recuperar-senha` quando configurado; campo 2FA no login quando necessário; cartão 2FA em configurações.
3. Worker e Vite repassam variáveis Turnstile ao `createApiHandler`.

## Fora de escopo

- SMS/e-mail OTP, WebAuthn, rate limit em rotas de banco autenticadas.
