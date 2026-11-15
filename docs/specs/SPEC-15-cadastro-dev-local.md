# SPEC-15 Cadastro público (só dev local)

Status: concluída.

## Objetivo

Permitir **criar conta** por e-mail e senha apenas em desenvolvimento local (Docker / Dev Container / Vite). Em produção (Worker), o cadastro público permanece **fechado** por padrão.

## Regras

1. Variável `AUTH_SIGN_UP_ENABLED`:
   - **Worker (produção):** cadastro só quando o valor é exatamente `true`. Padrão do deploy: **não** definir (desligado).
   - **Dev (Vite):** ligado por padrão; desligar com `AUTH_SIGN_UP_ENABLED=false` em `.docker/.env`.
2. Com cadastro desligado, `POST /api/auth/sign-up` → **403** e mensagem em português.
3. Com cadastro ligado: e-mail válido (com `@`), senha ≥ 6 caracteres, Turnstile se configurado (mesmo critério de login), conta `standard` (não demo). E-mails reservados (admin seed, demo, alias `teste`) → **400**.
4. Sucesso: resposta igual ao login (`user`, `accessToken`); sessão segue fluxo atual.
5. `GET /api/auth/security` inclui `signUpEnabled` para a UI esconder `/cadastro` e links.
6. Rota `/cadastro` redireciona para `/entrar` quando `signUpEnabled` é falso.
7. Em `/entrar`, link “Criar conta” só aparece com cadastro ligado.

## Aceite

1. Teste unitário: cadastro desligado → 403.
2. Teste unitário: cadastro ligado, e-mail novo → 200 com token (mock SQL).
3. OpenAPI e documentação dinâmica descrevem o comportamento condicional.

## Fora de escopo

- Convite por e-mail, aprovação admin, Google OAuth.