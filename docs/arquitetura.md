# Arquitetura

App web responsivo para controlar empréstimos e compras parceladas com o próprio dinheiro. O front chama `/api/*` no mesmo domínio; a API fala com o Neon Postgres.

## Stack

React, Vite, TypeScript, Tailwind, Vitest, Neon (`@neondatabase/serverless`), JWT (HS256). PDF gerado no cliente: **pdf-lib** (carnê e extrato de caixinha), **html2pdf.js** (extrato de saldo livre a partir de HTML com estilos compatíveis com html2canvas); utilitários em `src/pdf/` (`pdf-draw`, `wrap-pdf-text`, `embed-data-url-image`). QR Pix via `qrcode`.

## Produção

Cloudflare Worker (`worker/index.ts`) serve a API e os arquivos estáticos de `dist` (SPA). Deploy com `wrangler deploy` após `npm run build`.

## Rotas

| Rota | Acesso |
| --- | --- |
| `/` | Público, com gerador de carnê |
| `/entrar`, `/cadastro`, `/recuperar-senha` | Público |
| `/inicio`, `/parcelamentos`, `/parcelamentos/:planId`, `/financeiro`, `/relatorios`, `/configuracoes` | Conta |

Visitante guarda só o rascunho da sessão. Logado persiste por registro no Postgres via JWT.

## Visitante e logado

```text
Landing -> sessionStorage -> PDF
Login -> JWT + BankRepository HTTP -> áreas internas
```

A implementação em memória existe para testes e para o contrato do repositório.
