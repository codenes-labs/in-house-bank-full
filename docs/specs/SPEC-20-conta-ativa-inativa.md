# SPEC-20 Conta ativa / inativa (holding)

Status: concluída.

## Objetivo

Permitir ao admin holding **inativar** e **reativar** cadastros de **empresa** e **demonstração**. Conta **administração** (`001001`) não pode ser inativada. Login em conta inativa recusa com mensagem orientando contato, sem revelar senha incorreta vs inativa quando a senha está errada.

## Regras

1. Coluna `users.account_active boolean not null default true` (schema, patch, migration em `docs/migrations/`).
2. **Quem pode alternar:** JWT `canManageHoldingAccounts`; alvo com perfil **Empresa** ou **Demonstração** (`PATCH /api/holding/companies/{userId}/active` corpo `{ active: boolean }`).
3. **Login `POST /api/auth/sign-in`:** se a conta existe, senha correta e `account_active = false`, resposta **400** com texto: *Conta não localizada. Entre em contato com o setor responsável.* (não emite token). Senha incorreta em conta inativa: mantém *E-mail ou senha incorretos.*
4. **`GET /api/auth/session`:** conta inativa não restaura sessão (`user: null`, `accountInactive: true`). APIs autenticadas com JWT válido mas conta inativa respondem **403** com o mesmo corpo (`accountInactive: true`). O cliente **limpa o token e encerra a sessão** (evento em requisições protegidas + checagem periódica/ao voltar à aba), redirecionando para `/entrar` sem UI travada.
5. **UI lista** (`/holding/empresas`): coluna Status prioriza **Inativo** → **Senha pendente** → **Ativo**.
6. **UI detalhe** (SPEC-19): situação do cadastro + **Inativar cadastro** / **Ativar cadastro** quando permitido.

## Aceite

1. Testes: domínio (quem pode alternar), sign-in conta inativa com senha correta, API PATCH rejeita admin, lista expõe `accountActive`.
2. Build e testes existentes passam.

## Fora de escopo

- Bloquear recuperação de senha com mensagem específica (permanece resposta genérica quando e-mail não habilita fluxo).