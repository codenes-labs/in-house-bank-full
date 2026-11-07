# Changelog

Marcos do produto In House Bank. Atualize **neste arquivo** e em `src/domain/docs/product-changelog.ts` no mesmo trabalho (SPEC-11).

## [0.2.0] — 2026-11-07

### Adicionado

- Resgate do saldo livre com histórico (`free_balance_withdrawals`) e linhas no extrato (Saldo livre / Caixinha).
- Entrada e saída em `/financeiro/saldo-livre`; crédito automático no saldo livre ao marcar parcela paga.
- Documentação pública em `/docs` e referência OpenAPI em `/docs/api`.
- Termos de uso e política de privacidade.
- Página de changelog em `/docs/changelog`.

### Alterado

- Financeiro: KPIs clicáveis; placeholders de contas a pagar/receber.
- Caixinha: excluir e voltar no topo do detalhe.

## [0.1.0] — 2026-03-20

### Adicionado

- Caixinhas, financeiro e parcelamentos com reimpressão/exclusão em lote.
- Neon + RLS; contas seed admin e demo.
