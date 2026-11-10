import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../components/auth-context';
import { useBank } from '../components/bank-context';
import { DueDateRangePicker } from '../components/due-date-range-picker';
import { FilterField } from '../components/filter-field';
import { LedgerHistoryByMonth } from '../components/ledger-history-by-month';
import { DownloadPdfActionButton } from '../components/standard-action-buttons';
import { Button, Card, EmptyState } from '../components/ui';
import { calendarMonthRangeForDate } from '../domain/calendar/calendar-month-range';
import { demoExtratoDefaultPeriod } from '../domain/demo/demo-finance-history-period';
import { effectiveTodayForPresentation } from '../domain/demo/demo-presentation-reference-date';
import {
  formatInstallmentDueDateRangeLabel,
  type InstallmentDueDateRange,
} from '../domain/installments/installment-due-date-range';
import { buildLedger, filterLedgerByExtratoKind } from '../domain/ledger/build-ledger';
import { filterLedgerLinesByDateRange } from '../domain/ledger/filter-ledger-lines-by-date-range';
import {
  EXTRATO_KIND_OPTIONS,
  ExtratoKind,
  parseExtratoKind,
  type ExtratoKind as ExtratoKindValue,
} from '../domain/ledger/extrato-kind';
import { groupLedgerLinesByMonth } from '../domain/ledger/group-ledger-lines-by-month';
import { buildCashBoxExtratoPdfFilename } from '../domain/pdf/build-cash-box-extrato-pdf-filename';
import { buildFreeBalanceExtratoPdfFilename } from '../domain/pdf/build-free-balance-extrato-pdf-filename';
import { downloadPdfBytes } from '../pdf/download-pdf-bytes';
import { generateCashBoxExtratoPdf } from '../pdf/generate-cash-box-extrato-pdf';
import { generateFreeBalanceExtratoPdf } from '../pdf/generate-free-balance-extrato-pdf';
import { resolveExtratoPdfSettings } from '../pdf/resolve-extrato-pdf-settings';

type LedgerPeriodExtratoKind = typeof ExtratoKind.CashBox | typeof ExtratoKind.FreeBalance;

function extratoKindLabel(kind: ExtratoKindValue): string {
  return EXTRATO_KIND_OPTIONS.find((option) => option.value === kind)?.label ?? 'Extrato';
}

function rangesEqual(left: InstallmentDueDateRange, right: InstallmentDueDateRange): boolean {
  return left.from === right.from && left.to === right.to;
}

function extratoPdfFilename(kind: LedgerPeriodExtratoKind, range: InstallmentDueDateRange): string {
  return kind === ExtratoKind.CashBox
    ? buildCashBoxExtratoPdfFilename(range)
    : buildFreeBalanceExtratoPdfFilename(range);
}

const KIND_HINTS: Record<ExtratoKind, string> = {
  [ExtratoKind.Payables]: 'Lançamentos de contas a pagar aparecerão aqui quando a área estiver ativa no Financeiro.',
  [ExtratoKind.Receivables]: 'Lançamentos de contas a receber aparecerão aqui quando a área estiver ativa no Financeiro.',
  [ExtratoKind.Installments]: 'Extrato de parcelas pagas e pendentes (SPEC-10: integração com buildLedger).',
  [ExtratoKind.CashBox]: 'Movimentos de aporte e resgate das caixinhas.',
  [ExtratoKind.FreeBalance]: 'Entradas e saídas registradas do saldo livre.',
};

function usesLedgerPeriodFilter(kind: ExtratoKindValue): kind is LedgerPeriodExtratoKind {
  return kind === ExtratoKind.CashBox || kind === ExtratoKind.FreeBalance;
}

export function ExtratoPage() {
  const auth = useAuth();
  const bank = useBank();
  const [searchParams] = useSearchParams();
  const kind = parseExtratoKind(searchParams.get('tipo'));
  const isDemo = auth.session?.user.isDemo ?? false;
  const today = effectiveTodayForPresentation(isDemo);
  const periodFilter = usesLedgerPeriodFilter(kind);
  const [customRange, setCustomRange] = useState<InstallmentDueDateRange | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const ledgerLinesForKind = useMemo(() => {
    const ledger = buildLedger({
      cashBoxes: bank.snapshot.cashBoxes,
      cashBoxMovements: bank.snapshot.cashBoxMovements,
      freeBalanceWithdrawals: bank.snapshot.freeBalanceWithdrawals,
      freeBalanceDeposits: bank.snapshot.freeBalanceDeposits,
    });
    return filterLedgerByExtratoKind(ledger, kind);
  }, [bank.snapshot, kind]);

  const defaultPeriodRange = useMemo(() => {
    if (isDemo && periodFilter) {
      return demoExtratoDefaultPeriod(
        ledgerLinesForKind.map((line) => line.date),
        today,
      );
    }
    return calendarMonthRangeForDate(today);
  }, [isDemo, ledgerLinesForKind, periodFilter, today]);

  const activeRange = customRange ?? defaultPeriodRange;
  const showCustomClear =
    customRange !== null && !rangesEqual(customRange, defaultPeriodRange);

  const lines = useMemo(() => {
    if (periodFilter) {
      return filterLedgerLinesByDateRange(ledgerLinesForKind, activeRange);
    }
    return ledgerLinesForKind;
  }, [activeRange, ledgerLinesForKind, periodFilter]);

  const lineGroups = useMemo(
    () => (periodFilter ? groupLedgerLinesByMonth(lines) : []),
    [lines, periodFilter],
  );

  async function downloadExtrato() {
    if (!periodFilter) {
      return;
    }
    setPdfBusy(true);
    try {
      const pdfSettings = await resolveExtratoPdfSettings(bank.snapshot.settings);
      const bytes =
        kind === ExtratoKind.FreeBalance
          ? await generateFreeBalanceExtratoPdf({
              period: activeRange,
              periodLines: lines,
              allLines: ledgerLinesForKind,
              currentBalanceCents: bank.snapshot.settings.freeBalanceCents,
              settings: pdfSettings,
              issuedAt: new Date(),
            })
          : await generateCashBoxExtratoPdf({
              title: extratoKindLabel(kind),
              period: activeRange,
              lines,
              settings: pdfSettings,
            });
      downloadPdfBytes(extratoPdfFilename(kind, activeRange), bytes);
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold lg:hidden">{extratoKindLabel(kind)}</h1>
        {periodFilter ? (
          <div className="grid gap-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <FilterField label="Período" className="w-full sm:max-w-xs">
                <DueDateRangePicker
                  value={activeRange}
                  onChange={(next) => {
                    if (next) {
                      setCustomRange(next);
                    } else {
                      setCustomRange(null);
                    }
                  }}
                  placeholder={formatInstallmentDueDateRangeLabel(defaultPeriodRange)}
                  ariaLabel={`Período do extrato de ${extratoKindLabel(kind).toLowerCase()}`}
                />
              </FilterField>
              <DownloadPdfActionButton
                label="Baixar extrato"
                busy={pdfBusy}
                disabled={lines.length === 0 && kind !== ExtratoKind.FreeBalance}
                onClick={() => void downloadExtrato()}
                className="min-h-10 w-full shrink-0 sm:w-auto"
              />
            </div>
            {showCustomClear ? (
              <Button
                type="button"
                variant="ghost"
                className="min-h-10 justify-self-start px-0 text-sm font-semibold text-primary"
                onClick={() => setCustomRange(null)}
              >
                Limpar filtro
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {periodFilter ? (
        <Card className="grid gap-3">
          <h2 className="font-semibold">Histórico</h2>
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">{KIND_HINTS[kind]}</p>
          ) : (
            <LedgerHistoryByMonth groups={lineGroups} />
          )}
        </Card>
      ) : (
        <EmptyState title="Extrato em desenvolvimento" text={KIND_HINTS[kind]} />
      )}
    </div>
  );
}
