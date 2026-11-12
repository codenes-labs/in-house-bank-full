# Auditoria de segurança (nov/2026)

Escopo: código em `src/server`, Worker, auth, RLS e deploy. Pentest externo e `npm audit` não fazem parte deste documento.

## Resumo

| Severidade | Achados iniciais | Situação após mitigações (nov/2026) |
| --- | --- | --- |
| Alta | Recover sem prova de e-mail; `totpBegin` desligava 2FA; Turnstile opcional em prod; senhas seed no repo | Recover **off** no Worker por padrão ([SPEC-14](specs/SPEC-14-recuperacao-senha.md)); `totpBegin` exige senha+código se 2FA ativo; CI exige Turnstile no deploy; seed continua documentado — trocar senha admin em prod |
| Média | JWT localStorage; changePassword sem senha atual; headers; import sem validação; Docker secrets | Senha atual obrigatória; headers em API e assets; `assertAppDataBackup` no import; `.dockerignore` + entrypoint sem `.dev.vars` |
| Baixa | Health enum; openapi público; idle só cliente | Aceitos / monitorar |

## Checklist de produção (operacional)

| Item | Como verificar |
| --- | --- |
| Turnstile | GitHub Actions valida `TURNSTILE_SECRET_KEY` e `TURNSTILE_SITE_KEY` antes do deploy |
| JWT_SECRET | ≥ 32 caracteres no secret do Actions / Worker |
| DATABASE_URL | Só no Worker (Wrangler secrets); não em imagem Docker (`.dockerignore`) |
| Recover | Só ligar com `AUTH_PASSWORD_RECOVER_ENABLED=true` no Worker se aceitar o risco do fluxo legado |
| Admin | Senha inicial `CodenesTemp1` trocada após primeiro login |
| 2FA | Contas reais com TOTP em Configurações → Usuário |

## Isolamento de dados

- Tabelas de carnê: RLS + `app.user_id` em transação (ver `schema.ts`, `user-backup.ts`).
- Teste estático: `schema.spec.ts`.
- Teste live opcional: `bank-isolation.integration.spec.ts` (roda com `DATABASE_URL` + `JWT_SECRET` no ambiente).

## Pendências conscientes (fora deste ciclo)

- Sessão em cookie httpOnly e revogação de JWT.
- Recover com link ou OTP por e-mail.
- CSP fina e revisão do Swagger em `/docs/api`.
- RLS em `users` (trade-off com login na mesma role).
- Credenciais demo/admin fora do código-fonte (hoje documentadas em `docs/banco.md`).

## Referências

- [SPEC-13](specs/SPEC-13-auth-protecao-brute-force.md) — brute force, Turnstile, TOTP.
- [SPEC-14](specs/SPEC-14-recuperacao-senha.md) — recover desligado em produção por padrão.
