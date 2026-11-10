# SPEC-10 Contas, extrato, caixinhas e menu

Status: pendente.

Contas a receber, contas a pagar avulsas e recorrentes, extrato do que já aconteceu, caixinha com meta opcional de aporte, menu reorganizado e relatório em texto, no formato de extrato, sem gráfico. Não muda paleta, não movimenta dinheiro e não substitui parcelamento.

Dinheiro em centavos. Datas `YYYY-MM-DD`. IDs UUID. Status de conta e de parcela continua derivado, nunca gravado. Dados novos só entram por `BankRepository`.

## Objetivo

A pessoa registra o que tem para receber e para pagar. Conta a pagar pode ser avulsa ou recorrente, e as duas formas ficam disponíveis na mesma tela. Na recorrente, ela vê se o valor subiu ou desceu. Lê um extrato único dos fatos já lançados, acompanha a caixinha com a meta que já existe mais uma meta opcional de aporte no mês, e abre um relatório em texto, sem gráfico. O menu separa essas áreas sem estourar a barra de cinco itens do celular.

## Regras

### 1. Contas a receber

Registrar aluguel, serviço ou venda, com valor e vencimento.

- Modelo `Receivable` em `src/domain/models/receivable.ts`: `id`, `title`, `kind` (`RENTAL`, `SERVICE`, `SALE`), `amountCents` maior que zero, `dueDate`, `receivedDate` opcional.
- Status em `deriveReceivableStatus`, igual à parcela: com `receivedDate` está recebido; vencimento anterior a hoje, atrasado; senão, pendente.
- Tela `/a-receber`: lista, formulário (título, tipo, valor, vencimento) e ação de marcar recebido, gravando a data de hoje. Desfazer recebimento limpa `receivedDate`.
- Não gera parcela, não mexe no Pix e não cria cliente à parte. O título identifica a conta.

Arquivos: o modelo, `src/domain/enums/receivable-kind.ts`, `src/domain/receivables/validate-receivable.ts`, `src/domain/receivables/derive-receivable-status.ts`, `src/pages/receivables-page.tsx`, métodos no `BankRepository` (memória e HTTP), tabela `receivables` em `src/server/schema.ts` com RLS `user_id = current_setting('app.user_id')::uuid`, mapeamento em `rows.ts` e `user-backup.ts`, rota em `create-api-handler.ts` e em `src/App.tsx`.

Aceite: os três tipos gravam e reaparecem depois do reload. Valor zero ou data inválida não grava. Sem `receivedDate`, atraso depende só da data de hoje. Marcar recebido não altera `amountCents`.

### 2. Contas a pagar

Registrar o que sai. A conta é recorrente ou não recorrente. As duas opções são obrigatórias e aparecem juntas no formulário, com rótulos “Não recorrente” e “Recorrente”. Nenhuma fica escondida nem como atalho secundário. O padrão do formulário é “Não recorrente”.

A recorrente serve para a conta do mês, como energia: a pessoa marca “Recorrente” e lança um valor por mês para ver se subiu ou desceu. A não recorrente é um pagamento único, com um valor e um vencimento.

- `Payable` em `src/domain/models/payable.ts`: `id`, `title`, `recurring` (booleano). `false` é não recorrente. `true` é recorrente.
- `PayableOccurrence` em `src/domain/models/payable-occurrence.ts`: `id`, `payableId`, `amountCents` maior que zero, `dueDate`, `paidDate` opcional.
- Não recorrente: `recurring` falso e exatamente uma ocorrência. A tela não oferece “lançar próximo mês”.
- Recorrente: `recurring` verdadeiro e uma ocorrência por mês, lançada pela pessoa. Não há gerador automático de meses. A tela oferece “lançar próximo mês”: sugere o vencimento um mês à frente e deixa o valor em branco.
- A lista mostra as duas, cada uma com o rótulo “Recorrente” ou “Não recorrente”.
- A escolha vale na criação e não troca depois. Quem errou o tipo exclui e cria de novo.
- Status da ocorrência deriva como a parcela, em `derivePayableOccurrenceStatus`.
- `comparePayableTrend` devolve, na ordem do vencimento, cada ocorrência depois da primeira como `UP`, `DOWN` ou `EQUAL` contra o valor anterior. Conta não recorrente não tem tendência.

Arquivos: modelos, `src/domain/payables/validate-payable.ts`, `derive-payable-occurrence-status.ts`, `compare-payable-trend.ts`, `src/pages/payables-page.tsx`, repositório, tabelas `payables` e `payable_occurrences` com a mesma RLS, rows, backup e API.

Aceite: dá para criar e quitar uma conta não recorrente e uma recorrente na mesma tela. Energia recorrente com 100, 120 e 90 reais mostra sobe, depois desce. A não recorrente não mostra tendência nem “lançar próximo mês”. Pagar grava `paidDate` e não muda o valor. Ocorrência sem título de conta não grava.

### 3. Histórico de movimentação

Extrato só de leitura, calculado, sem tabela própria. A ordem é data decrescente.

`buildLedger` em `src/domain/ledger/build-ledger.ts` junta:

| Fato | Data da linha | Sentido |
| --- | --- | --- |
| Aporte de caixinha | data do movimento | entra |
| Resgate de caixinha | data do movimento | sai |
| Parcela do plano | vencimento | a receber, ainda não é caixa |
| Parcela com `paidDate` | data do pagamento | entra |
| Conta a receber com `receivedDate` | data do recebimento | entra |
| Ocorrência a pagar com `paidDate` | data do pagamento | sai |

A parcela usa o vencimento porque o modelo não tem data de criação. Não acrescentar `createdAt` nesta spec. Pendência sem pagamento não entra no extrato.

Cada linha tem `id` estável (`origem:id`), data, rótulo em português, `amountCents` e o sentido. A tela `/extrato` lista isso. Não edita nem apaga por ali.

Aceite: um aporte, uma parcela paga e uma conta paga aparecem com as datas certas e a ordem da mais nova para a mais antiga. Apagar o aporte some a linha, porque ela é derivada.

### 4. Caixinhas

Continua o `CashBox` que já existe: nome, instituição, percentual do CDI, saldo, aporte, resgate e `limitCents`. O limite segue sendo o teto que recusa aporte acima dele. A barra de progresso que o relatório já calcula (saldo sobre o limite) passa a aparecer na própria caixinha quando o limite existe.

Meta de movimentação, opcional: `monthlyMovementGoalCents` no `CashBox`. Se estiver ausente, a caixinha não mostra meta de aporte. Se estiver presente, a meta do mês é a soma dos aportes daquela caixinha com data no mês corrente, comparada ao valor. Resgate não entra nessa soma. A função fica em `src/domain/cash-boxes/monthly-deposit-goal.ts`.

A tela sai de dentro de `/financeiro` e vai para `/caixinhas`, com o mesmo aporte, resgate e desfazer. `/financeiro` fica com saldo livre, patrimônio, rendimento estimado e metas de patrimônio. O rendimento continua não creditado sozinho.

Aceite: caixinha sem limite e sem meta mensal se comporta como hoje. Aporte que passa de `limitCents` continua recusado. Com meta mensal de 200 reais, aportes de 50 e 30 no mês mostram 80 de 200. Resgate no mês não reduz esses 80.

### 5. Menu

O menu que a pessoa vê é o de `src/components/app-shell.tsx`. A barra de baixo permanece em cinco colunas.

Lateral, nesta ordem, em três grupos só visuais:

- Movimento: Início `/inicio`, Parcelamentos `/parcelamentos`, A receber `/a-receber`, A pagar `/a-pagar`, Extrato `/extrato`
- Patrimônio: Caixinhas `/caixinhas`, Financeiro `/financeiro`
- Análise: Relatórios `/relatorios`, Ajustes `/configuracoes`

No celular, a barra e a lateral derivam de `src/domain/navigation/logged-shell-nav.ts` (grupos desktop e três itens na barra inferior).

Aceite: os cinco itens da barra e os oito da lateral batem com esta lista. `/mais` não aparece na lateral. Portfolio não desabilita as rotas novas.

### 6. Relatórios

`/relatorios` hoje só mostra gráfico: barras de fluxo, barras de lucro e linha de patrimônio, em `src/pages/reports-page.tsx`, com `recharts`. O gráfico sai. No lugar fica um relatório em texto, no jeito de extrato: linhas com rótulo e valor, sem eixo, grade, legenda ou desenho.

Os números continuam os de `computeReports`. Esta spec não cria indicador novo e não apaga a função. A página deixa de importar `recharts`. O vazio deixa de dizer que os gráficos aparecem quando houver dados.

A tela é uma coluna só, no celular e no computador. De cima para baixo:

1. Título “Relatórios” e a data de hoje escrita por extenso.
2. Resumo do mês corrente, quatro linhas: a receber, recebido, lucro previsto, lucro realizado. Rótulo à esquerda, valor em reais à direita.
3. Meses, da data mais recente para a mais antiga. Cada mês é uma linha com o mês, o recebido e o a receber, lidos em `monthlyCashFlow`.
4. Por tipo de operação. Cada tipo é uma linha com lucro previsto e lucro realizado, lidos em `profitByType`.
5. Patrimônio. Cada mês é uma linha com o valor, lido em `patrimonyEvolution`. Sem linha ligando os pontos.

Sem dados de parcelamento e de caixinha, um texto “Sem dados ainda”. Sem ilustração.

Arquivo: `src/pages/reports-page.tsx`.

Aceite: a página não renderiza gráfico. Com um mês de fluxo e um tipo de plano, mês, valores e tipo aparecem como texto. O vazio não menciona gráfico.

### Backup e isolamento

`AppDataBackup` vai para a versão 2, com `receivables`, `payables` e `payableOccurrences`. Importar versão 1 continua válido e essas três listas nascem vazias. `monthlyMovementGoalCents` ausente no JSON antigo permanece ausente. Tabelas novas seguem `docs/banco.md`: `user_id` e RLS pela setting da transação. Um usuário não lê nem grava linha de outro.

## Fora de escopo

- Baixa parcial, juros, multa e parcelar uma conta a receber.
- Gerar sozinho o mês seguinte da conta recorrente.
- Extrato gravado ou editável.
- Caixinha nova paralela à que já existe, ou crédito automático de rendimento.
- Mudança de paleta.
- Gráfico em `/relatorios`, inclusive barra, linha e rosca.

## Critérios de aceite

1. Aluguel, serviço e venda gravam valor e vencimento; o status sai da data de recebimento e do vencimento.
2. Conta a pagar não recorrente e conta recorrente são as duas criáveis na mesma tela. A recorrente acumula ocorrências e mostra sobe, desce ou igual. A não recorrente não mostra tendência.
3. O extrato lista aporte, resgate, parcela pelo vencimento, recebimento de parcela, recebimento de conta e pagamento, sem tabela nova.
4. A caixinha segue na regra atual de teto e ganha a meta mensal de aporte só quando o campo existe.
5. Lateral e barra de baixo seguem o menu desta spec, e o backup versão 1 ainda importa.
6. `/relatorios` é um extrato em texto, com resumo, meses, tipo de operação e patrimônio. Não há gráfico na página.

## Testes

- `deriveReceivableStatus` e `derivePayableOccurrenceStatus`: pendente, atrasado, quitado.
- `comparePayableTrend`: sobe, desce, igual; conta não recorrente sem tendência.
- Validar os dois tipos de conta a pagar: `recurring` falso aceita uma ocorrência; `recurring` verdadeiro aceita mais de uma.
- `validate-receivable` e `validate-payable`: valor não positivo e data inválida falham.
- `buildLedger`: os seis fatos, ordem por data, linha some quando o fato some.
- `monthly-deposit-goal`: sem meta; soma só aportes do mês; resgate fora da soma; teto de `limitCents` inalterado nos testes que já existem.
- Backup: versão 1 sem as listas novas importa com listas vazias.
- Menu: ordem da lateral e Relatórios desabilitado só no portfolio.
