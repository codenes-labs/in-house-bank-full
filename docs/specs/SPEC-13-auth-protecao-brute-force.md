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
9. No formulário, o widget Turnstile é criado uma vez (não a cada tecla). Se o token ainda não chegou ao enviar, o botão espera o desafio invisível e segue no mesmo clique. A mensagem de captcha pendente só aparece se o widget falhar ou estourar a espera. Token já enviado é descartado e o widget reinicia.

### 2FA (TOTP)

10. Colunas `users.totp_secret`, `users.totp_enabled`.
11. Configuração em **Configurações → Usuário**: `POST /api/auth/totp/begin`, `enable`, `disable`. Com `totp_enabled`, **begin** exige senha atual e código 2FA (ou desativar antes via disable). **Disable** exige senha + código.
12. Login: após senha correta, se `totp_enabled`, exige `totpCode` (6 dígitos, janela ±1 período).
13. Falhas de TOTP contam no rate limit de sign-in.

## Aceite

1. Testes em `login-lockout.spec.ts`, `rate-limit-subjects` (via `worstRateLimitLock`), `totp.spec.ts`, `read-client-ip.spec.ts`, `auth-captcha-gate.spec.ts`.
2. UI: captcha em `/entrar` e `/recuperar-senha` quando configurado; um clique espera o token invisível em vez de pedir o captcha de novo; campo 2FA no login quando necessário; cartão 2FA em configurações.
3. Worker e Vite repassam variáveis Turnstile ao `createApiHandler`.

## Fora de escopo

- SMS/e-mail OTP, WebAuthn, rate limit em rotas de banco autenticadas.
