# SPEC-14 Recuperação de senha (segura por padrão)

Status: concluída.

## Objetivo

Evitar reset de senha por e-mail sem prova de posse da caixa. Em produção, a recuperação pública fica **desligada** até configuração explícita.

## Regras

1. Variável `AUTH_PASSWORD_RECOVER_ENABLED`:
   - **Worker (produção):** recuperação só quando o valor é exatamente `true` (secret ou var no deploy).
   - **Dev (Vite):** ligada por padrão; desligar com `AUTH_PASSWORD_RECOVER_ENABLED=false` em `.docker/.env`.
2. `POST /api/auth/recover` com recover desligado → **403** e mensagem em português.
3. Com recover ligado, fluxo atual (SPEC-13): e-mail + nova senha, Turnstile se configurado, rate limit.
4. `GET /api/auth/security` inclui `passwordRecoverEnabled` para o cliente esconder links e avisar na tela.
5. Recuperação por **e-mail com link ou OTP** fica fora de escopo; contas reais em produção devem trocar senha logados ou pedir reset manual a um administrador.

## Aceite

1. Teste unitário do handler quando recover desabilitado.
2. Deploy CI valida `JWT_SECRET` (≥ 32), `DATABASE_URL` e **exige** `TURNSTILE_SECRET_KEY` no job Cloudflare.
3. Documentação em `docs/banco.md` e relatório de auditoria atualizados.
