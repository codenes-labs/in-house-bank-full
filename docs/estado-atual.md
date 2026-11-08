# Estado atual do projeto

Última atualização: 2026-03-20 (sessão de parcelamentos e governança de specs).

Referência rápida para agentes e implementadores. Detalhes de domínio seguem em `docs/principios.md`, `docs/arquitetura.md` e `docs/banco.md`.

## Produto

App web para controlar empréstimos e compras parceladas com dinheiro próprio. **Não movimenta dinheiro** e não é meio de pagamento.

Stack: React, Vite, TypeScript, Tailwind, Vitest, Neon Postgres, JWT, PDF no cliente (`pdf-lib`). Produção no Cloudflare Worker com API e estáticos no mesmo domínio.

## Governança

- Specs em `docs/specs` (SPEC-01 a SPEC-10; SPEC-09 Projeto B e SPEC-10 contas/menu pendentes de implementação).
- **Regra ativa:** toda alteração de código que muda comportamento ou UI deve atualizar a spec relacionada no mesmo PR/trabalho.
- Este arquivo resume o estado **atual** da UI e decisões recentes; specs continuam sendo a fonte de critérios de aceite.

## Menu logado (hoje)

Barra inferior (3 itens): Início, Patrimônio (`/patrimonio` hub), Relatórios (`/relatorios` com abas Extrato e Resumo). Lateral `lg+`: grupos em `logged-shell-nav.ts` (Patrimônio: Financeiro, Caixinhas, Parcelamentos; um item Relatórios).

Rotas privadas principais: `/inicio`, `/patrimonio`, `/financeiro`, `/financeiro/saldo-livre`, `/caixinhas`, `/parcelamentos`, `/relatorios/extrato`, `/relatorios/resumo`, `/configuracoes`.

Rotas públicas extras: `/docs` (hub técnico: stack, arquitetura, Neon, CI/CD, deploy, apresentação/vídeo), `/docs/api` (Swagger), `/termos`, `/privacidade` com textos completos. Rodapé na landing. `GET /api/openapi.json` (SPEC-11). Não aparecem no menu logado.

## Parcelamentos — lista (`/parcelamentos`)

- Lista: em mobile/tablet, um badge de status por parcelamento (à direita do nome); desktop mantém colunas Pagador, Referência, Status, Retorno, Pagas.
- Filtros: busca, vencimento, status, ordenação.

## Parcelamentos — detalhe (`/parcelamentos/:planId`)

- Cabeçalho: pagador, status do plano, referência, retorno, WhatsApp.
- Ações no topo: **Editar**, **Reimprimir**, **Excluir** (checkboxes ocultos por padrão).
- Modo de seleção: 1º toque em **Reimprimir** ou **Excluir** mostra checkboxes; barra do topo mantém Editar/Reimprimir/Excluir primeiro e **Selecionar todas** + **Cancelar** numa segunda linha. 2º toque no mesmo botão confirma (Excluir vira **Confirmar exclusão** no modo exclusão).
- **Reimprimir:** no modo de reimpressão, gera PDF das marcadas (`selectInstallmentsForReprint`).
- **Excluir:** no modo exclusão, todas marcadas → plano inteiro; parte → só selecionadas; nenhuma → aviso.
- Cada parcela: fluxo de marcar paga (valor creditado no **saldo livre**), Pix, WhatsApp e ajustar valor/vencimento inalterados.
- Sem botões Reimprimir / Excluir parcela nem select “Ações” por parcela (área “Ajustar parcela” só valor e vencimento).

## Outras telas (resumo)

- **Início:** dashboard (SPEC-08 pendente em parte).
- **Financeiro:** KPIs clicáveis (saldo livre, caixinhas), patrimônio e rendimento estimado; cards **Contas a receber** e **Contas a pagar** só visuais (não clicáveis, SPEC-10). **Saldo livre** → `/financeiro/saldo-livre` (entrada/saída). Parcela paga credita o saldo livre.
- **Relatórios / Extrato:** filtro **Saldo livre** e **Caixinha** listam linhas de `buildLedger`; demais tipos ainda em desenvolvimento. Resumo: gráficos Recharts (SPEC-10 prevê extrato em texto no resumo — não implementado).
- **Configurações:** negócio, Pix padrão, CDI, metas, backup.

## Contas e seed

Cadastro público fechado. Contas seed: admin e demo (`docs/banco.md`). RLS por `user_id`.

## CI

GitHub Actions: lint (oxlint), testes (Vitest). Deploy em `master` para Cloudflare. Docker: dev em `.docker/` (porta 5173); produção local com `Dockerfile` + `compose.prod.yaml` na raiz (8787). SPEC-09 (Projeto B) ainda pendente no pipeline (coverage mínimo, integração, ADR, etc.).

## Decisões recentes (UI)

| Data | Decisão |
| --- | --- |
| 2026-03-20 | Lista de parcelamentos: colunas Referência vs Status corrigidas no layout `lg`. |
| 2026-03-20 | Detalhe: checkboxes só após Reimprimir ou Excluir; confirmação no 2º toque; botão **Reimprimir**. |
| 2026-03-20 | Specs devem ser atualizadas junto com cada mudança; estado geral neste arquivo. |
