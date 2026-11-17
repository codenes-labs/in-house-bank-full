# SPEC-19 Holding — detalhe do cadastro da empresa

Status: concluída.

## Objetivo

Lista de empresas resumida (padrão parcelamentos) com abertura do cadastro individual; edição de cadastro, permissões de menu por tela, senha consultável pelo admin e exclusão só no detalhe.

## Regras

1. **Lista `/holding/empresas`:** colunas ID cadastro (dígitos), Empresa (nome + e-mail), Perfil, Status; linha clicável → `/holding/empresas/{userId}`.
2. **Detalhe `/holding/empresas/{userId}`:** só quem passa `canProvisionHoldingCompanies`.
3. **Dados do cadastro:** botão **Editar dados** para nome, cidade, documento (máscara CPF/CNPJ) e **e-mail de acesso** (editável só em **Empresa**; admin e demo editam os demais campos; e-mail fixo com aviso em linha própria abaixo da linha e-mail/documento, sem desalinhar o grid). `PATCH .../profile`.
4. **Sem dados operacionais no detalhe** (SPEC-18 mantém regra no servidor para exclusão).
5. **Senha (mesma seção):** **Ver senha** / **Atualizar senha** com o mesmo layout em **empresa, administração e demonstração**. `POST .../password`. `holding_reveal_password` sincroniza com cadastro, holding, troca de senha do titular (exceto login demo bloqueado na Conta) e seed das contas sistema.
6. **Permissões:** empresa e **demonstração** usam **Gerenciar permissões** (menu editável; demo inicia com todas as telas se não houver JSON salvo). Admin `001001`: **Ver permissões** somente leitura (todas marcadas; troca no login desmarcada). **Exigir troca de senha no próximo login** só em conta empresa. **Excluir** só contas empresa.
7. **Ativar / inativar (SPEC-20):** empresa e demo — card **Situação do cadastro** no detalhe; administração não inativa.
7. **Menu da empresa:** shell filtra itens conforme `menuAccess.routes` na sessão.
8. **Excluir:** regras SPEC-18; só no detalhe.
9. **`GET /api/holding/companies/{userId}`:** inclui `menuAccess`, `revealPassword` (admin holding).

## Aceite

1. Testes: menu por rota, documento mascarado, detalhe, senha, profile com e-mail, menu-access.
2. Permissões com categoria + telas; senha ver/atualizar alinhado ao layout.

## Fora de escopo

- Impersonate; exibir hash de senha.