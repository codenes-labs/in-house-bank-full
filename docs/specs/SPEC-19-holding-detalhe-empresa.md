# SPEC-19 Holding — detalhe do cadastro da empresa

Status: concluída.

## Objetivo

Lista de empresas resumida (padrão parcelamentos) com abertura do cadastro individual; permissões, senha e exclusão só no detalhe.

## Regras

1. **Lista `/holding/empresas`:** colunas ID cadastro (dígitos), Empresa (nome + e-mail), Perfil, Acesso; linha clicável → `/holding/empresas/{userId}`. Sem checkbox, lixeira ou cidade na lista.
2. **Detalhe `/holding/empresas/{userId}`:** só quem passa `canProvisionHoldingCompanies` (admin ou delegado — SPEC-19 regra 6).
3. **Seção Dados:** ID, nome (`business_name`), e-mail, cidade, documento (se houver), perfil, data de cadastro, 2FA, resumo de dados operacionais (parcelamentos, caixinhas, saldo livre).
4. **Senha:** não exibir senha armazenada; texto explicativo; admin define **nova senha** (≥ 6 caracteres) via API.
5. **Permissões (só perfil Empresa):** alternar troca de senha obrigatória; alternar **Acesso ao menu Holding** (`users.holding_delegate`).
6. **`holding_delegate`:** boolean em `users`; `canProvisionHoldingCompanies` = admin fixo **ou** (standard + `holding_delegate` + não demo). Só o admin fixo altera delegate de outras contas.
7. **Excluir:** mesmas regras SPEC-18 (vazio vs dados + backup); só no detalhe; admin/demo não excluíveis.
8. **`GET /api/holding/companies/{userId}`:** JWT com permissão holding; corpo da empresa completo.
9. **`POST /api/holding/companies/{userId}/password`:** `{ newPassword }`.
10. **`PATCH /api/holding/companies/{userId}/holding-access`:** `{ enabled: boolean }`.

## Aceite

1. Testes: delegate no domínio, GET detalhe, senha admin, holding-access.
2. Lista abre detalhe; cadastro novo permanece em `/holding/empresas/novo`.

## Fora de escopo

- Login como empresa (impersonate); edição de e-mail.