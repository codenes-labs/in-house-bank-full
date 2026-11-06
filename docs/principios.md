# Princípios

O desenvolvimento segue SDD: a spec vem antes do código de produção, e cada regra tem teste.

## Ciclo

1. Especificar em `docs/specs`.
2. Escrever o teste que falha.
3. Implementar o mínimo para passar.
4. Refatorar com os testes protegendo.
5. Atualizar a spec e só então marcá-la como concluída.

## Código

- TypeScript estrito, sem `any`.
- Nomes técnicos em inglês. Textos da interface em português do Brasil.
- Dinheiro em centavos inteiros. Datas `YYYY-MM-DD`. IDs UUID.
- Domínio em `src/domain`, sem React e sem Supabase.
- Dados só passam por `BankRepository`.
- Status de parcela e de plano é derivado, nunca gravado.

## Camadas

| Camada | Pasta | Depende de |
| --- | --- | --- |
| domain | `src/domain` | nada |
| application | `src/application` | domain |
| infrastructure | `src/repositories` | domain |
| presentation | `src/components`, `src/pages`, `src/pdf` | application e domain |

## Pronto quando

A spec existe, os testes unitários passam, o lint e o build passam, e tabelas novas têm RLS por `user_id = current_setting('app.user_id')::uuid`.

## Interface

Celular primeiro, no navegador. Abaixo de `lg`, navegação inferior e cartões. De `lg` para cima, menu lateral e tabelas. Tema claro e escuro. Não alterar a paleta sem pedido.
