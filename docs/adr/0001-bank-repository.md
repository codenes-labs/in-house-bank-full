# ADR 0001 — Dados da conta via `BankRepository`

Status: aceito  
Data: 2026-11-11

## Contexto

O app persiste carnê, parcelamentos, caixinhas e saldo livre por usuário no Neon. O front é React; a API é um handler Fetch no Worker. Precisávamos de um limite claro entre UI, domínio e persistência, sem espalhar SQL ou detalhes do Neon nas telas.

## Opções consideradas

1. **`BankRepository` (interface)** — componentes e domínio falam com uma porta; implementação HTTP na área logada e em memória em testes/demo.
2. **Componentes chamando Postgres/Neon direto** — hooks ou serviços no front com connection string ou queries duplicadas.

## Decisão

Adotar **`BankRepository`** em `src/repositories/bank-repository.ts`. A implementação de produção é `HttpBankRepository` (`/api/bank*`). Testes e conta demo usam repositório em memória. O domínio não importa React nem Neon.

## Consequências

- Duas implementações (HTTP e memória) para manter alinhadas ao contrato.
- Toda mutação autenticada passa pela API com JWT e RLS no servidor — o front nunca vê `DATABASE_URL`.
- Alternativa 2 descartada: acoplaria UI ao schema SQL e tornaria testes e demo frágeis.
