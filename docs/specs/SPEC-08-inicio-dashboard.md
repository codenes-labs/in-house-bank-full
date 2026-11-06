# SPEC-08 Início — melhorias do dashboard

Status: pendente.

Refinar a tela `/inicio` (hero, KPIs, próximas parcelas e patrimônio) com copy correta, navegação útil e layout mobile-first. Não alterar paleta. Dinheiro continua em centavos no domínio.

## Objetivo

Deixar o dashboard coerente com os dados já calculados em `computeDashboardMetrics` e alinhado ao restante do app (Parcelamentos, Financeiro, ocultar valores).

## Regras

### Card Patrimônio — texto da meta

| Situação | Condição (domínio) | Texto esperado (exemplo) |
| --- | --- | --- |
| Metas não configuradas | `milestonesCents` vazio após defaults de negócio (lista efetiva vazia ou só zeros) | Orientar a definir metas em Ajustes |
| Meta em andamento | `nextMilestoneCents` não nulo | Manter padrão atual: próxima meta, mês de referência, barra proporcional a `milestoneProgressPercent` |
| Todas as metas alcançadas | `nextMilestoneCents` nulo **e** `milestoneProgressPercent === 100` | Não usar “Defina metas em Configurações”; mensagem do tipo “Última meta alcançada” (barra cheia) |

### Hero “a receber”

- Se `overdueCount > 0`, o subtítulo de atraso usa tom de status de atraso (token existente) e é link para `/parcelamentos` com filtro **Em atraso** (mesmo comportamento da lista de parcelamentos).
- Opcional nesta spec: exibir valor total em atraso (`overdueAmountCents`) ao lado ou abaixo da contagem, respeitando ocultar valores.

### Próximas parcelas

- Cabeçalho do card com link **Ver todas** → `/parcelamentos`.
- Cada item navega para `/parcelamentos/:planId`.
- Status com `StatusPill` (mesmas labels/tons da lista de parcelamentos).
- Em viewport abaixo de `sm`: layout em duas linhas (pagador + status; vencimento + valor), sem fileira única apertada.

### KPIs (quatro cards)

- Cada card tem texto de ajuda curto (uma linha) explicando: Saídas, Retorno previsto, Lucro previsto, Recebido.
- Avaliar exibir **lucro realizado** (`realizedProfitCents`) — substituir ou complementar “Lucro previsto” quando houver parcelas pagas; decisão de UX documentada no PR.

### Ocultar valores (olho)

- Preferência já persistida em `localStorage` (`dashboard-values-visibility`) deve valer também em `/financeiro` e `/parcelamentos` (valores monetários mascarados com os helpers existentes).
- Com valores ocultos na home: barra de meta não zera de forma que pareça erro — esconder barra ou mostrar bloco neutro mascarado (escolher uma opção e testar).

### Copy e links

- Empty state de “Próximas parcelas” para usuário logado não menciona carnê na landing pública; orientar Parcelamentos ou carnê salvo na conta.
- “Bem-vindo” pode usar primeiro token do e-mail ou `settings.businessName` quando preenchido (sem expor documento).
- Card patrimônio: deixar claro que **metas** ficam em Ajustes e **saldo livre/caixinhas** em Financeiro (dois links ou uma frase explícita).

### Valores absurdos (saldo livre)

- Ao salvar saldo livre ou caixinha, validar teto razoável ou pedir confirmação acima de limite definido na spec de implementação (evitar patrimônio digitado por engano). Limite exato fica para o PR; critério: usuário não persiste valor claramente errado sem confirmação.

## Fora de escopo (desta spec)

- Formulário de interesse na landing (versão beta demo) — spec própria quando existir página.
- Mudanças em `computeDashboardMetrics` além de expor dados já calculados na UI.

## Critérios de aceite

1. Com patrimônio acima da última meta default, a home **não** mostra “Defina metas em Configurações” com barra em 100%.
2. Com parcelas em atraso, subtítulo do hero leva à lista filtrada em atraso.
3. Item de próxima parcela abre o detalhe do plano; “Ver todas” abre parcelamentos.
4. Com olho fechado, financeiro e parcelamentos mascaram valores monetários de forma consistente com o início.
5. Testes unitários cobrem a função de copy da meta (três estados) se extraída para `domain/dashboard`; demais itens verificáveis por teste de componente ou checklist manual documentado no PR.

## Testes sugeridos

- `resolveNextMilestoneProgress` / helper de mensagem de meta: três cenários (sem metas, em progresso, todas alcançadas).
- Regressão: `compute-dashboard-metrics` existente permanece verde.
