# SPEC-16 Extrato de parcelamento

Status: concluída.

Extrato em **Relatórios → Parcelamento** (`tipo=INSTALLMENTS`), no mesmo padrão visual de período, histórico mensal e PDF dos extratos de Caixinha e Saldo livre. Não altera esses extratos nem o ledger de movimentação da SPEC-10.

## Objetivo

A pessoa filtra um período e vê resumo do mês (parcelas pagas, valor recebido no período e quantas estão vencidas no recorte), mais a lista cronológica das parcelas com vencimento, valor, status derivado e vínculo ao carnê (pagador/referência).

## Regras

1. **Período:** igual aos extratos Caixinha/Saldo livre — mês atual por padrão; demo usa o intervalo das datas de vencimento/pagamento fictícias; calendário customizado e **Limpar filtro**.
2. **Inclusão na lista:** parcela entra se `dueDate` está no período **ou** `paidDate` está no período.
3. **Resumo do período** (três cards):
   - **Pagas no período:** contagem de parcelas com `paidDate` no intervalo.
   - **Recebido no período:** soma de `amountCents` dessas parcelas pagas no intervalo.
   - **Em atraso:** parcelas listadas no período cujo status derivado hoje é `OVERDUE`.
4. **Lista:** agrupada por mês de vencimento (`dueDate`), mais recente primeiro; dentro do mês, vencimento decrescente. Cada linha: vencimento, valor, status (`Paga`, `Pendente`, `Vencida`), título com ordinal + pagador e referência do plano como “conta”.
5. **PDF:** botão **Baixar extrato** (mesmo componente dos demais); arquivo `extrato-parcelamento-{de}_{ate}.pdf`; layout reutiliza `generateCashBoxExtratoPdf` com linhas derivadas do extrato de parcelas.
6. Domínio em `src/domain/installments/build-installment-extrato.ts`; status só via `deriveInstallmentStatus`.

## Fora de escopo

- Contas a pagar/receber no extrato unificado.
- Edição ou quitação na tela de extrato.

## Aceite

1. `/relatorios/extrato?tipo=INSTALLMENTS` mostra período, três cards de resumo, histórico e **Baixar extrato**.
2. Parcela paga com `paidDate` fora do vencimento aparece quando o pagamento ou o vencimento cai no filtro.
3. Demo lista parcelas fictícias no período padrão ampliado.
4. PDF baixa com nome `extrato-parcelamento-…`.

## Testes

- `build-installment-extrato.spec.ts` — filtro, métricas, ordenação.