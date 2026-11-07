# Estrutura de navegação — Caixinhas (estilo Nubank)

Documento de desenho para revisão **antes** da implementação. Não substitui a SPEC-10; indica como encaixar o UX pedido na SPEC-10 e o que precisa ser ajustado na spec ao fechar o desenho.

**Status:** proposta em revisão.

## Objetivo

Separar **visão de patrimônio** (`/financeiro`) da **vida das caixinhas** (`/caixinhas` + detalhe), com lista enxuta, detalhe rico e histórico agrupado por mês — sem página única longa com formulários e histórico de todas as caixinhas.

Referências de produto: lista de “caixinhas” da Nubank (cards compactos → detalhe); extrato agrupado por mês com total do período. **Não** copiar identidade visual da Nubank; manter paleta e componentes atuais do In House Bank.

## Relação com a SPEC-10

| Tema | SPEC-10 hoje | Esta proposta |
| --- | --- | --- |
| Onde ficam aporte/resgate | `/caixinhas` | Igual: só no **detalhe** da caixinha |
| `/financeiro` | Saldo livre, patrimônio, rendimento, metas — **sem** bloco de caixinhas | Mantém SPEC-10: **sem** operações nem histórico; pode ter **um** resumo clicável (total em caixinhas → `/caixinhas`) |
| Menu | Barra inferior: **Início**, **Patrimônio**, **Relatórios**; lateral em grupos | **Caixinhas** dentro de Patrimônio (`/patrimonio` → `/caixinhas`); extrato unificado em `/relatorios/extrato` |
| Criar caixinha | Implícito na rota de caixinhas | Painel lateral **Criar caixinha** (já iniciado em `FinancialPage`; **mover** para `/caixinhas`) |
| Desfazer movimento | SPEC-10 §4 menciona desfazer | Produto atual: **sem desfazer**; corrigir com resgate/aporte. Atualizar SPEC-10 §4 na implementação |
| Gráfico | `/relatorios` sem gráfico (SPEC-10 §6) | Gráfico **só** no detalhe da caixinha (aportes mês a mês); não usa a página Relatórios |

**Decisão para o usuário revisar:** os **cards** (nome, saldo, mini-indicador) ficam na **home de caixinhas** (`/caixinhas`), não em `/financeiro`. Assim `/financeiro` continua enxuto conforme SPEC-10. Se a equipe quiser cards também em `/financeiro`, é mudança explícita na SPEC-10 §4.

---

## Rotas

| Rota | Papel | Observação |
| --- | --- | --- |
| `/financeiro` | Painel patrimonial | Cards KPI (saldo livre, total caixinhas, patrimônio), rendimento estimado, meta de patrimônio, atualizar saldo livre. Link ou card-resumo “Caixinhas” → `/caixinhas`. |
| `/caixinhas` | Home das caixinhas | Lista de cards; botão **+ Criar caixinha** (painel lateral); estado vazio com CTA. |
| `/caixinhas/:cashBoxId` | Detalhe de uma caixinha | Saldo, metadados, aporte/resgate, histórico por mês, gráfico de aportes, excluir (painel de confirmação existente). |
| `/patrimonio` | Hub Patrimônio (mobile e desktop) | Atalhos: Financeiro, Caixinhas, Parcelamentos. |
| `/relatorios` | Relatórios | Abas internas **Extrato** e **Resumo** (`/relatorios` redireciona para extrato). |
| `/relatorios/extrato` | Extrato | Filtro: contas a pagar, a receber, parcelamento ou caixinha. |
| `/relatorios/resumo` | Resumo | Gráficos/indicadores (até migrar para texto na SPEC-10). |

Rotas antigas `/a-receber`, `/a-pagar`, `/extrato` e `/mais` redirecionam para os destinos acima.

Deep link: toque no card em `/caixinhas` → `/caixinhas/:id`. Voltar: navegação padrão (seta do app ou link “Caixinhas” no topo do detalhe).

---

## Fluxos

### A. Ver patrimônio sem operar caixinha

1. Menu → **Financeiro** (`/financeiro`).
2. Lê totais; opcionalmente toca “Caixinhas R$ …” → `/caixinhas`.

### B. Listar e criar

1. **Patrimônio** → Caixinhas → `/caixinhas` (ou atalho direto na lateral).
2. Vê grid/lista de cards (uma linha por caixinha no mobile, grid no `lg+`).
3. **+ Criar caixinha** → painel lateral (mesmo padrão `OverlayPanel` do parcelamento): nome, instituição, % CDI, saldo inicial, limite opcional → salvar → painel fecha, lista atualiza.

### C. Operar uma caixinha

1. Em `/caixinhas`, toca no card → `/caixinhas/:id`.
2. No topo: nome, instituição, saldo em destaque, linha secundária (CDI, rendimento mensal **estimado**).
3. Se `limitCents` definido: barra de progresso saldo/limite (SPEC-10 §4).
4. Se `monthlyMovementGoalCents` definido (futuro SPEC-10): barra meta de aportes no mês corrente (domínio `monthly-deposit-goal`).
5. Formulário compacto: valor + **Aportar** / **Resgatar** (submitter no `FormData`; limpar campo após sucesso).
6. Rolagem: **Histórico** agrupado por mês + **gráfico** de aportes.

### D. Excluir

1. No detalhe, **Voltar para todas as caixinhas** e **Excluir caixinha** no topo (mesmo tamanho de fonte) → painel lateral já usado hoje: confirma transferência do saldo para saldo livre → confirma → volta para `/caixinhas` (ou permanece em financeiro se veio de lá; **preferência:** redirecionar para `/caixinhas`).

---

## Telas e componentes (apresentação)

### `/financeiro` (enxuto)

- **Remover** do estado atual: cards expandidos por caixinha, formulários de aporte e histórico inline.
- **Manter / adicionar:** KPIs, meta patrimônio, saldo livre; **resumo** “Total em caixinhas” navegável.

### `/caixinhas` (home estilo Nubank — lista)

| Componente | Conteúdo |
| --- | --- |
| `CashBoxListPage` | Cabeçalho “Caixinhas”, botão **+ Criar caixinha**. |
| `CashBoxSummaryStrip` (opcional) | Soma dos saldos + rendimento mensal estimado agregado (reusa `computeFinancialOverview`). |
| `CashBoxListCard` | Nome, saldo (`money`), mini-indicador (ver abaixo), área de toque → detalhe. |
| `CreateCashBoxPanel` | `OverlayPanel` + formulário (extraído do que hoje está em `FinancialPage`). |
| `EmptyState` | Sem caixinhas + CTA criar. |

**Mini-indicador no card (escolher um na implementação, após revisão):**

- Opção A (recomendada): texto curto “~R$ X/mês” (rendimento estimado daquela caixinha).
- Opção B: barra fina de limite, só se `limitCents` existir.
- Opção C: “+R$ Y no mês” = soma de aportes no mês corrente (só informativo).

### `/caixinhas/:cashBoxId` (detalhe)

| Componente | Conteúdo |
| --- | --- |
| `CashBoxDetailPage` | Orquestra dados da caixinha + movimentos do `BankRepository`. |
| `CashBoxDetailHeader` | Saldo, metadados, barras opcionais (limite / meta mensal). |
| `CashBoxMovementForm` | Aporte/resgate (lógica atual de `applyCashBoxMovement` + `saveMovement`). |
| `CashBoxHistoryByMonth` | Seções por mês (ver domínio). |
| `CashBoxDepositsByMonthChart` | Barras simples mês a mês (somente **aportes**). |
| `DeleteCashBoxPanel` | Reutilizar cópia do painel de confirmação atual (transferência para saldo livre). |

**Sem** lista interminável no card da lista; histórico completo **só** no detalhe.

---

## Histórico agrupado por mês (padrão Nubank)

### Regras de negócio (domínio novo, sem tabela)

Entrada: `cashBoxMovements` filtrados por `cashBoxId`, ordenação global por data **decrescente**.

1. Agrupar por mês civil da `movement.date` (`YYYY-MM`).
2. Ordem dos grupos: mês mais recente primeiro.
3. Dentro do grupo: movimentos por data decrescente.
4. **Cabeçalho do mês:** rótulo em português (“Novembro de 2026”) + total exibido no estilo Nubank:
   - **Padrão proposto:** soma dos **aportes** (`DEPOSIT`) daquele mês naquela caixinha (ex.: “Entrou R$ 1.000,00”).
   - Resgates aparecem na lista mas **não** entram no total do cabeçalho (alinha à ideia “quanto entrou na caixinha no mês”).
5. Linha de movimento: ícone ou rótulo Aporte/Resgate, data (DD/MM/AAAA), valor (positivo; resgate pode usar cor/semântica existente do tema, sem paleta nova).

Funções sugeridas (nomes em inglês, UI em PT):

- `groupCashBoxMovementsByMonth(movements): MonthGroup[]`
- `sumDepositsCentsInMonth(movements, yearMonth): number`
- `formatYearMonthLabel(yearMonth, locale): string` (pt-BR)

Testes unitários obrigatórios antes da UI (SDD).

### Gráfico mês a mês

- Eixo X: meses que têm pelo menos um **aporte** (ou todos os meses entre o primeiro e o último aporte — **decisão na implementação:** preferir só meses com movimento).
- Eixo Y: total de aportes no mês (centavos).
- Visual: barras verticais simples (CSS/`div` com altura proporcional ou biblioteca leve). **Não** reutilizar o layout antigo de `/relatórios`.
- Sem eixo dollar do Recharts obrigatório; acessível: `aria-label` com valores por mês.
- Vazio: sem aportes → mensagem “Sem aportes ainda” no lugar do gráfico.

---

## Dados e camadas

### Já existem (sem migration)

- `CashBox`: `id`, `name`, `institution`, `cdiPercent`, `balanceCents`, `limitCents?`
- `CashBoxMovement`: `id`, `cashBoxId`, `type`, `amountCents`, `date`, `note?`
- `Settings.freeBalanceCents`, CDI, metas — para `/financeiro`
- `computeFinancialOverview` — totais e rendimento por caixinha
- `applyCashBoxMovement`, `validateCashBoxInput`, `settingsAfterDeletingCashBox` + `deleteCashBox` no repositório/API

### SPEC-10 ainda não implementado nos modelos

- `monthlyMovementGoalCents?` em `CashBox` — UI no detalhe quando existir; fora do primeiro slice se a spec atrasar.

### `BankRepository` (sem método novo obrigatório)

- Continua `load`, `saveCashBox`, `deleteCashBox`, `saveMovement`.
- Páginas derivam histórico e gráfico no cliente a partir do snapshot (como hoje).

### Menu (IA revisada — ver `logged-shell-nav.ts`)

- Mobile: **Início**, **Patrimônio**, **Relatórios** (três colunas).
- Desktop: grupos Início, Patrimônio (Financeiro, Caixinhas, Parcelamentos), Relatórios (um item → abas Extrato/Resumo), Conta (Ajustes).
- Contas a pagar/receber não têm rota própria: entram no **Financeiro** (futuro) e no **Extrato** com filtro.

---

## Ordem sugerida de implementação (após aprovação deste doc)

1. Domínio: agrupamento mensal + totais de aporte + dados do gráfico (testes).
2. Rotas `/caixinhas` e `/caixinhas/:cashBoxId`; registrar em `App.tsx`.
3. Mover criação (painel) e exclusão (painel) do `FinancialPage` para as novas páginas; enxugar `/financeiro`.
4. Menu + `/mais` (SPEC-10 §5).
5. Atualizar SPEC-10 §4 (desfazer, texto de telas) e `docs/estado-atual.md`.
6. Teste manual / E2E: aporte, limpar campo, excluir com transferência.

---

## Critérios de aceite (revisão com usuário)

1. `/financeiro` não exibe histórico nem formulário de aporte por caixinha.
2. `/caixinhas` lista cards compactos; criar abre painel lateral.
3. Detalhe concentra aporte, resgate, histórico por mês e gráfico de aportes.
4. Cabeçalho do mês mostra total de **aportes** do mês; lista inclui resgates.
5. Exclusão mantém confirmação e transferência para saldo livre.
6. Navegação alinhada à SPEC-10 (Caixinhas + Mais).

---

## Fora deste desenho

- Editar nome/instituição/CDI da caixinha após criação (não pedido).
- Crédito automático de rendimento.
- Extrato global (`/extrato`) — SPEC-10 §3, trabalho separado.
- Movimentar dinheiro real ou integração bancária.
