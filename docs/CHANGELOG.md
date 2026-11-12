# Changelog

Marcos do produto In House Bank. Atualize **neste arquivo** e em `src/domain/docs/product-changelog.ts` no mesmo trabalho (SPEC-11).

## [0.2.2] — 2026-11-11

### Segurança

- Recuperação por e-mail desligada no Worker por padrão (SPEC-14); CI exige Turnstile no deploy.
- 2FA: `totp/begin` não desativa TOTP sem senha e código quando já ativo.
- Troca de senha exige senha atual (exceto primeiro acesso); headers de segurança na API e nos assets.
- Import de backup validado; Docker ignora `.env`/`.dev.vars`; entrypoint usa `--env-file` temporário.
- Relatório: `docs/auditoria-seguranca-2026-11.md`.

## [0.2.1] — 2026-11-10

Versão de consolidação dos commits locais após **0.2.0** (extrato, relatórios, PDFs, configurações e demo).

### Adicionado

- Hub **Relatórios** com **Extrato** por tipo (Saldo livre, Caixinha, demais em desenvolvimento) e **Resumo**.
- Extrato de Saldo livre e Caixinha: filtro de **período**, **Limpar filtro**, histórico por mês na tela e **Baixar extrato** em PDF.
- PDF do extrato de **saldo livre** (HTML + `html2pdf.js`): cards de resumo, saldo após cada movimentação, rodapé com paginação.
- Conta **demo**: snapshot fictício de caixinhas e saldo livre; extrato demo com período das movimentações de exemplo.
- **Entrada no saldo livre** ao excluir caixinha, com nota `Resgate da caixinha {nome}` no histórico e no extrato.
- Hub **Configurações** (SPEC-12): Usuário, Beneficiário, Parcelamentos, Financeiro, Gerais, Backup (JSON, logotipo, textos do carnê e WhatsApp).
- **Simulador de juros** no carnê (valor, taxa e quantidade de parcelas).
- Ambiente **Docker** de desenvolvimento (compose na pasta `.docker/`).

### Alterado

- PDF do **carnê** e extrato de **caixinha** (`pdf-lib`): utilitários em `src/pdf/`, cabeçalho azul-marinho e extrato caixinha agrupado por mês.
- **Parcelamentos**: paginação, ordenação por vencimento e botões de ação padronizados.
- **Início**: próximas parcelas por vencimento; tabela no desktop.
- **Saldo livre**: lançamento em uma linha (entrada e saída).
- Menu mobile: atalho **Configurações** e ícones na navegação.

### Corrigido

- Calendário de vencimento nos filtros fecha corretamente no celular.
- Conta demo não grava mutações no Neon (sessão de demonstração isolada).
- Preferência de **tema** claro/escuro persiste após recarregar a página.

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
