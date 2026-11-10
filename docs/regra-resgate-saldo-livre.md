# Regra de negócio — Resgate do saldo livre

**Status:** implementado.

**Contexto:** `free_balance_cents` muda por **entrada** manual, **saída** (resgate registrado), crédito ao **marcar parcela paga** em parcelamentos, e crédito ao **excluir caixinha**.

---

## Objetivo

Permitir que a pessoa registre **saída de dinheiro do saldo livre** (uso fora do controle do app), com valor e data, reduzindo saldo e patrimônio de forma auditável — no mesmo espírito do **resgate de caixinha**, sem movimentar dinheiro real.

---

## Como a pessoa registra

- No card KPI **Saldo livre** em **`/financeiro`** (clicável → **`/financeiro/saldo-livre`**): um valor e dois botões — **Entrada** (soma ao saldo) e **Saída** (resgate registrado), como aporte/resgate de caixinha.
- Valor deve ser **maior que zero** e **não pode exceder** o `free_balance_cents` atual; se exceder, mensagem de saldo insuficiente (equivalente a `INSUFFICIENT_BALANCE` nas caixinhas).
- Opcional em implementação futura: confirmação para valores acima de um teto (alinhar à SPEC-08 para saldo livre).

**Fora desta regra:** **Aporte de caixinha** não debita saldo livre nesta proposta.

**Excluir caixinha:** o saldo da caixinha soma ao `free_balance_cents` e grava **`FreeBalanceDeposit`** com observação `Resgate da caixinha {nome}` (aparece no extrato e em **Últimos lançamentos** em `/financeiro/saldo-livre`).

---

## Efeito no saldo livre

- Ao confirmar um resgate de `amountCents`:
  - `free_balance_cents` passa a `free_balance_cents - amountCents`.
  - Inteiro em centavos; saldo resultante ≥ 0.
- Persistência via camada existente (`saveSettings` ou operação atômica equivalente no repositório/API que atualize settings **e** grave o movimento na mesma transação).

**Parcelamentos:** ao marcar uma parcela paga, o `amountCents` da parcela **entra** no saldo livre; desfazer pagamento ou alterar valor de parcela paga ajusta o saldo de forma simétrica (`settingsAfterInstallmentChange`).

---

## Movimentos registrados

### Saída — `FreeBalanceWithdrawal`

| Campo | Regra |
| --- | --- |
| `id` | UUID |
| `amountCents` | inteiro > 0 |
| `date` | `YYYY-MM-DD` (data do registro, padrão: hoje) |
| `note` | opcional, texto curto |

- **Tipo na interface:** rótulo **Resgate** (não confundir com resgate de caixinha nem com sangria de parcelamento).
- **Sem desfazer** na UI (mesma decisão de produto das caixinhas): corrigir com novo ajuste ou novo lançamento acordado em spec futura.
- Tabela com `user_id` e RLS `user_id = current_setting('app.user_id')::uuid`; inclusão no backup (`AppDataBackup` versão futura).

Não reutilizar `cash_box_movements` — o saldo livre não é caixinha.

### Entrada auditável — `FreeBalanceDeposit`

| Campo | Regra |
| --- | --- |
| `id` | UUID |
| `amountCents` | inteiro > 0 |
| `date` | `YYYY-MM-DD` |
| `note` | texto curto (ex.: `Resgate da caixinha Reserva`) |

Usado ao **excluir caixinha** com saldo > 0 e para entradas fictícias na demo; entradas manuais pelo botão **Entrada** ainda só alteram `free_balance_cents` (registro de depósito manual é evolução futura).

---

## Onde o histórico aparece

1. **Extrato (Relatórios → Extrato):** incluir linha no ledger unificado (`buildLedger`, SPEC-10), sentido **saída**, rótulo em português (ex.: “Resgate do saldo livre”), `id` estável (ex.: `free-balance-withdrawal:{id}`), data do movimento, valor.
2. **Filtro de extrato:** visível no tipo adequado — sugerido novo valor de filtro **Saldo livre** ou agrupar em **Financeiro** quando existir; até lá, listar no extrato geral / tipo que abranger movimentos de patrimônio líquido.
3. **Opcional em `/financeiro/saldo-livre`:** lista curta “Últimos resgates” (ex.: 5 linhas); **fonte de verdade** para histórico completo = Extrato.

Histórico de **caixinha** permanece no detalhe `/caixinhas/:id`; não misturar listas na mesma tela.

---

## Impacto no patrimônio

Patrimônio continua **saldo livre + soma dos saldos das caixinhas** (`computeDashboardMetrics`, `computeFinancialOverview`, relatórios).

Um resgate de `amountCents` do saldo livre:

- reduz `free_balance_cents` em `amountCents`;
- **não** altera caixinhas;
- reduz **patrimônio** em exatamente `amountCents`.

Metas de patrimônio (barra em Financeiro / Início) recalculam com o novo patrimônio.

---

## Alinhamento com caixinhas

| Aspecto | Caixinha | Saldo livre (proposta) |
| --- | --- | --- |
| Operação de saída | Resgatar + valor | Resgatar + valor |
| Validação | saldo ≥ valor | `free_balance_cents` ≥ valor |
| Submit | submitter no formulário | idem |
| Campo após sucesso | limpar valor | idem |
| Histórico | por caixinha + extrato (futuro) | extrato (+ opcional resumo em Financeiro) |
| Desfazer | não | não |

---

## Critérios de aceite (revisão)

1. Resgate de R$ 50 com saldo livre R$ 200 deixa R$ 150 e patrimônio 150 menor que antes (se caixinhas inalteradas).
2. Resgate acima do saldo livre é recusado com mensagem clara.
3. Cada resgate gera um registro consultável e uma linha no Extrato (quando `buildLedger` estiver implementado).
4. Excluir caixinha e resgate do saldo livre são fatos distintos; ambos podem aparecer no extrato com rótulos diferentes.

---

## Fora de escopo desta regra

- Debitar saldo livre automaticamente ao **aportar** em caixinha.
- Juros, taxa ou rendimento creditado no saldo livre.
- Meio de pagamento ou integração bancária.
