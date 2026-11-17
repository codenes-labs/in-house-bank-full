# SPEC-19 Holding — detalhe do cadastro da empresa

Status: concluída.

## Objetivo

Lista de empresas resumida (padrão parcelamentos) com abertura do cadastro individual; edição de cadastro, permissões de menu por tela, senha consultável pelo admin e exclusão só no detalhe.

## Regras

1. **Lista `/holding/empresas`:** colunas ID cadastro (dígitos), Empresa (nome + e-mail), Perfil, Status; linha clicável → `/holding/empresas/{userId}`.
2. **Detalhe `/holding/empresas/{userId}`:** só quem passa `canProvisionHoldingCompanies`.
3. **Dados do cadastro:** botão **Editar dados** (contas empresa) para nome, cidade, **e-mail de acesso**, documento com máscara CPF/CNPJ. `PATCH .../profile`. Documento persiste só dígitos; exibição mascarada.
4. **Sem dados operacionais no detalhe** (SPEC-18 mantém regra no servidor para exclusão).
5. **Senha (mesma seção):** **Ver senha** abre painel com senha consultável, **Fechar** e **Atualizar senha**. Na atualização: componente **input group** (`InputWithInlineActions`) — campo, ícone **gerar** e **Salvar** na mesma faixa; **Fechar** cancela edição. Cadastro novo usa o mesmo campo (só gerar, sem Salvar na faixa). `POST .../password`.
6. **Permissões:** painel lateral; categorias Patrimônio, Holding, Relatórios, Conta. Checkbox da categoria marca todas as telas; expandir permite tela a tela (rotas do menu). Padrão: todas as telas exceto Holding. `PATCH .../menu-access` com `{ routes, mustChangePassword? }` em `users.menu_access`. `holding_delegate` segue rota `/holding/empresas`.
7. **Menu da empresa:** shell filtra itens conforme `menuAccess.routes` na sessão.
8. **Excluir:** regras SPEC-18; só no detalhe.
9. **`GET /api/holding/companies/{userId}`:** inclui `menuAccess`, `revealPassword` (admin holding).

## Aceite

1. Testes: menu por rota, documento mascarado, detalhe, senha, profile com e-mail, menu-access.
2. Permissões com categoria + telas; senha ver/atualizar alinhado ao layout.

## Fora de escopo

- Impersonate; exibir hash de senha.