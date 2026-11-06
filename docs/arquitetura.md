# Arquitetura

App web responsivo para controlar empréstimos e compras parceladas com o próprio dinheiro. O front fala direto com o Supabase. Não há API própria.

## Stack

React, Vite, TypeScript, Tailwind, Vitest, Supabase (Postgres, Auth, RLS). PDF no navegador com pdf-lib e qrcode.

## Rotas

| Rota | Acesso |
| --- | --- |
| `/` | Público, com gerador de carnê |
| `/entrar`, `/cadastro`, `/recuperar-senha` | Público |
| `/inicio`, `/parcelamentos`, `/parcelamentos/:planId`, `/financeiro`, `/relatorios`, `/configuracoes` | Conta |

Visitante guarda só o rascunho da sessão. Logado persiste por registro no Postgres.

## Visitante e logado

```text
Landing -> sessionStorage -> PDF
Login -> BankRepository Supabase -> áreas internas
```

A implementação em memória existe para testes e para o contrato do repositório.
