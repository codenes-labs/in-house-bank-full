# SPEC-21 Holding — acesso provisório (suporte)

Status: concluída.

## Objetivo

O admin holding **não consulta** a senha principal do usuário. Para testar login ou suporte, gera um **acesso provisório** que **não altera** `password_hash`. Só o admin holding vê a senha provisória em texto.

## Regras

1. **Colunas em `users`:** `holding_provisional_password_hash`, `holding_provisional_reveal`, `holding_provisional_valid_until` (timestamptz). A coluna legada `holding_reveal_password` deixa de receber a senha principal (patch zera uso).
2. **Login:** `POST /api/auth/sign-in` aceita senha principal **ou** provisória válida (não expirada).
3. **Holding:** `POST /api/holding/companies/{id}/provisional-access` gera (corpo opcional `generate`, `newPassword`, `validHours` default 72). `DELETE` ou `POST .../provisional-access/revoke` limpa. `GET` detalhe expõe `provisionalAccess` (reveal, `expiresAt`, `active`).
4. **`POST .../password`:** continua **redefinindo a senha principal**; ao salvar, **revoga** acesso provisório.
5. Troca de senha pelo titular (`/api/auth/password`, recuperação) **não** grava texto consultável; pode revogar provisório.
6. **Quem vê:** `reveal` só em `GET .../holding/companies/{id}` com JWT `canManageHoldingAccounts`.

## Aceite

1. Testes: sign-in com provisório, expirado falha, gerar não altera hash principal, revogar.
2. UI: texto explicando que a senha principal não é exibida.

## Fora de escopo

- Impersonate com sessão automática; auditoria por linha.