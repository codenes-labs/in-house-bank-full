---
name: testar-isolamento
description: Use sempre que uma tarefa criar ou alterar tabela, migration, política RLS ou consulta no Supabase. Garante que um usuário nunca enxerga dados de outro.
---

# Testar isolamento

## Quando usar

Toda vez que mexer em tabela, migration, política RLS ou consulta ao banco.

## Checklist

1. A tabela tem `user_id` obrigatório, com chave estrangeira para `auth.users`?
2. A tabela tem RLS ligada, com políticas de leitura, inserção, atualização e exclusão?
3. Cada política compara `auth.uid()` com `user_id`?
4. O teste da migration confirma RLS e as quatro políticas em todas as tabelas?
5. Existe índice em `user_id` nas tabelas que não usam essa coluna como chave primária?
6. O front usa só a chave anônima?

## Regras

- Nenhuma tabela de dados fica sem RLS.
- Nunca usar a chave de serviço do Supabase no front-end.
- Se algum item falhar, a tarefa não está pronta.
