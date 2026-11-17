# Changelog

Marcos do produto In House Bank. Atualize **neste arquivo** e em `src/domain/docs/product-changelog.ts` no mesmo trabalho (SPEC-11).

## [Unreleased]

### Adicionado

- Ativar/inativar cadastro de empresa e demo no holding (SPEC-20); login bloqueado com orientação de contato.
- Extrato de **Parcelamento** (SPEC-16): resumo do período, histórico por mês e **Baixar extrato** (PDF), alinhado a Caixinha/Saldo livre.
- Cadastro em `/cadastro` (SPEC-15): ligado por padrão no dev local; produção desligada até `AUTH_SIGN_UP_ENABLED=true` no Worker.
- Holding (SPEC-17, SPEC-18): admin lista contas, permissões de acesso e cadastra empresas (`/holding/empresas`, `/holding/empresas/novo`); `GET`/`POST`/`PATCH` em `/api/holding/companies`.

### Corrigido

- Postgres local (`pg-neon-compat`): transação devolve linhas de cada query — corrige `GET /api/bank` 500 após salvar tema/configurações.

### Corrigido

- **Marca IH:** `favicon.svg` volta ao texto centralizado (paths distorciam o ícone no app e na aba).
- **Favicon (prod e localhost):** `favicon.ico` + links no `index.html` — aba sem logo Vite (cache / fallback).

### Desenvolvimento

- Dev Container: **`postAttachCommand`** garante Vite ao conectar; porta **5173** só via publish do compose (sem `forwardPorts` duplicado); `start-dev-server.sh` reinicia Vite zumbi.
- **k6** na imagem dev (`.docker/Dockerfile.dev`); README focado em **Produção** + **Dev Container** (Vite sobe no `postStartCommand`, sem `make dev` duplicado).
- Doc de **rollback em produção** (`/docs/ci-cd`, `/docs/deploy`, README): Cloudflare, `wrangler rollback` e `git revert` na `master`.
- Compose dev com **Postgres** (`postgres:17-bookworm`), `.docker/.env.example` simplificado e driver local `pg` no Vite (`pg-neon-compat.ts`); Worker/prod inalterados (`neon-sql.ts`).
- SPEC-09 atualizada (Postgres no compose dev). Doc [`docs/observabilidade.md`](observabilidade.md) para logs e métricas.
- Compose dev: **Prometheus + Grafana** (só local). [`docs/metricas.md`](metricas.md). `/api/metrics` com exposição Prometheus.

## [0.2.3] — 2026-11-11

### Corrigido

- Login: o captcha invisível não pede um segundo clique. O envio espera o token e o botão mostra **Entrando…**.

### Projeto B (SPEC-09)

- Integração HTTP: `health.integration.spec.ts` (health + metrics sem Neon).
- Log JSON por `/api/*`, `GET /api/metrics`, `docs/slo.md`.
- Coverage com piso no CI (`test:coverage`).
- ADR `docs/adr/0001-bank-repository.md`, `docs/openapi.yaml`, smoke `perf/health-smoke.js`.

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
