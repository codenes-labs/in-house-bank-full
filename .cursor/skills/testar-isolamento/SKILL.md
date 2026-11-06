---
name: testar-isolamento
description: Use sempre que uma tarefa criar ou alterar tabela, schema, política RLS ou consulta no Neon. Garante que um usuário nunca enxerga dados de outro.
---

# Testar isolamento

## Quando usar

Toda vez que mexer em tabela, schema, política RLS ou consulta ao banco.

## Checklist

1. A tabela tem `user_id` obrigatório, com chave estrangeira para `users`?
2. A tabela tem RLS ligada, com políticas de leitura, inserção, atualização e exclusão?
3. Cada política compara `user_id` com `current_setting('app.user_id')`?
4. O teste em `src/server/schema.spec.ts` confirma RLS e as quatro políticas em todas as tabelas de dados?
5. Existe índice em `user_id` nas tabelas que não usam essa coluna como chave primária?
6. O front envia JWT e nunca recebe `DATABASE_URL` nem `JWT_SECRET`?

## Regras

- Nenhuma tabela de dados fica sem RLS.
- Segredos do banco ficam só no Worker ou no middleware de dev.
- Se algum item falhar, a tarefa não está pronta.
