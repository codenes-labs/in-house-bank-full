# SPEC-18 Holding — lista de empresas e permissões de acesso

Status: concluída.

## Objetivo

Evoluir a área **Cadastro de empresas** (SPEC-17) para o mesmo padrão de listagem de **Parcelamentos**: título, contagem, botão **Nova empresa** acima da lista, cadastro em rota dedicada, e visão de **permissões** de acesso por conta no banco.

## Regras

1. **Quem pode:** mesmas regras de SPEC-17 (`canProvisionHoldingCompanies` — JWT do `admin@codenes.com.br`, conta standard, não demo).
2. **UI `/holding/empresas`:** lista resumida (ID, Empresa, Perfil, Acesso); clique abre detalhe — ver [SPEC-19](SPEC-19-holding-detalhe-empresa.md). Botão **Nova empresa** → `/holding/empresas/novo`. Em `lg+` apenas (SPEC-17).
3. **UI `/holding/empresas/novo`:** formulário com **nome da empresa**, **cidade** (opcional, preenche `settings.city`), **e-mail de acesso** e **senha inicial**; layout alinhado ao fluxo de “Novo parcelamento” (voltar, título, cartão largo). Link **Voltar** para a lista; após sucesso redireciona para `/holding/empresas`.
4. **`users.registration_code`:** número único só com dígitos — empresas a partir de `100001` (sequencial); admin `0`, demo `1`. Gerado no provisionamento; backfill normaliza contas antigas (`REG-*`).
5. **Exibição do ID cadastro:** somente dígitos na UI (`formatRegistrationCodeDisplay`).
6. **Nome da empresa:** gravado em `settings.business_name` (beneficiário padrão em carnês/relatórios); listado na coluna Empresa junto ao e-mail.
7. **`GET /api/holding/companies`:** JWT admin; `{ companies: [...] }` com `registrationCode`, `businessName`, `email`, `city`, `profile`, `mustChangePassword`, `canEditAccess`, `canDelete`, `hasOperationalData`.
8. **Permissões, senha e exclusão:** apenas na tela de detalhe (SPEC-19).
9. **`POST /api/holding/companies`:** corpo `{ companyName, email, password, city? }`; cria `users` + `settings` iniciais; resposta com `registrationCode` e `companyName`.
10. **Dev:** handler da API no Vite recarrega o módulo a cada requisição; `ensureSchemaPatches` aplica coluna e backfill numérico.

## Aceite

1. Testes unitários: validação do cadastro holding, códigos numéricos, dados operacionais, `GET`/`PATCH`/`DELETE` holding.
2. Lista mostra ID numérico, empresa (nome + e-mail), cidade, perfil, acesso e permissão.
3. Cadastro com nome da empresa preenche beneficiário nos settings da nova conta.

## Fora de escopo

- Editar e-mail; papéis granulares; backup automatizado pelo admin (a empresa faz em Ajustes → Backup).