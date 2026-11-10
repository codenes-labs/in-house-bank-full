import { formatInstallmentDueDateRangeLabel } from '../../domain/installments/installment-due-date-range';
import type { InstallmentDueDateRange } from '../../domain/installments/installment-due-date-range';
import { computeFreeBalanceExtratoMetrics } from '../../domain/ledger/compute-free-balance-extrato-metrics';
import { groupLedgerLinesByMonth } from '../../domain/ledger/group-ledger-lines-by-month';
import { LedgerDirection } from '../../domain/ledger/ledger-direction';
import type { LedgerLine } from '../../domain/ledger/ledger-line';
import { formatCentsAsBrl } from '../../domain/money/brl-input';
import { formatCalendarDateBr } from '../../domain/pdf/format-calendar-date-br';
import { formatIssuedAtBr } from '../../domain/pdf/format-issued-at-br';
import type { Settings } from '../../domain/models/settings';
import { FREE_BALANCE_EXTRATO_CSS } from './free-balance-extrato-styles';
import { movementTypeLabelForDisplay } from './extrato-movement-type-label';

export interface FreeBalanceExtratoDocumentInput {
  period: InstallmentDueDateRange;
  periodLines: LedgerLine[];
  allLines?: LedgerLine[];
  currentBalanceCents?: number;
  settings: Pick<Settings, 'businessName' | 'logoDataUrl'>;
  issuedAt: Date;
}

const CELL_PAD = 'padding:10px 12px;';
const SUMMARY_LABEL =
  'margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#64748B;';
const SUMMARY_VALUE =
  'margin:0;font-size:17px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.25;white-space:nowrap;';
const TABLE_MONEY =
  'font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;';
const TABLE_BALANCE =
  'font-size:12px;font-weight:500;font-variant-numeric:tabular-nums;color:#475569;white-space:nowrap;';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function brlSigned(cents: number, direction: LedgerDirection): string {
  const sign = direction === LedgerDirection.Out ? '-' : '+';
  return `${sign}R$ ${formatCentsAsBrl(cents)}`;
}

function brlNeutral(cents: number): string {
  return `R$ ${formatCentsAsBrl(cents)}`;
}

function monthWithdrawalsCents(lines: readonly LedgerLine[]): number {
  return lines
    .filter((line) => line.direction === LedgerDirection.Out)
    .reduce((total, line) => total + line.amountCents, 0);
}

function buildLogoMark(logoDataUrl: string | undefined): string {
  const frame =
    'width:56px;height:56px;border-radius:50%;border:2px solid #1E3A8A;background:#FFFFFF;box-shadow:0 2px 10px rgba(30,58,138,0.15);';
  if (logoDataUrl) {
    return `<img src="${escapeHtml(logoDataUrl)}" alt="" width="56" height="56" style="${frame}object-fit:cover;display:block;" />`;
  }
  return `<div style="${frame}color:#1E3A8A;font-size:16px;font-weight:700;text-align:center;line-height:52px;">IH</div>`;
}

function buildHeader(brand: string, periodLabel: string, issuedLabel: string, logoDataUrl?: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 16px;border-collapse:collapse;">
      <tr>
        <td width="68" style="vertical-align:middle;padding-right:12px;">${buildLogoMark(logoDataUrl)}</td>
        <td style="vertical-align:top;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="background:#1E3A8A;border-radius:16px;color:#ffffff;border-collapse:separate;border-spacing:0;">
            <tr>
              <td style="padding:18px 20px;vertical-align:middle;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;opacity:0.92;">${escapeHtml(brand)}</p>
                <h1 style="margin:0;font-size:19px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;line-height:1.2;">
                  Extrato do saldo livre
                </h1>
              </td>
              <td style="padding:18px 20px;vertical-align:middle;text-align:right;white-space:nowrap;">
                <div style="display:inline-block;background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.22);border-radius:999px;padding:6px 14px;font-size:11px;font-weight:500;margin-bottom:6px;color:#ffffff;">
                  ${escapeHtml(periodLabel)}
                </div>
                <p style="margin:0;font-size:10px;opacity:0.88;">Emitido em ${issuedLabel}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function buildSummaryCards(metrics: ReturnType<typeof computeFreeBalanceExtratoMetrics>): string {
  const baseCard =
    'background:#ffffff;border:1px solid #E2E8F0;border-radius:12px;padding:12px 10px;vertical-align:top;';
  const movementHint =
    metrics.movementCount === 1
      ? '1 movimentação no período'
      : `${metrics.movementCount} movimentações no período`;

  return `
    <table width="100%" cellpadding="0" cellspacing="6" role="presentation" style="margin:0;border-collapse:separate;">
      <tr>
        <td width="25%" style="${baseCard}">
          <p style="${SUMMARY_LABEL}">Saldo inicial do período</p>
          <p style="${SUMMARY_VALUE}color:#0F172A;">${brlNeutral(metrics.openingBalanceCents)}</p>
        </td>
        <td width="25%" style="${baseCard}background:#ECFDF5;border-color:#A7F3D0;">
          <p style="${SUMMARY_LABEL}">Total de entradas</p>
          <p style="${SUMMARY_VALUE}color:#047857;">↑ ${brlSigned(metrics.totalInCents, LedgerDirection.In)}</p>
        </td>
        <td width="25%" style="${baseCard}background:#FEF2F2;border-color:#FECACA;">
          <p style="${SUMMARY_LABEL}">Total de saídas</p>
          <p style="${SUMMARY_VALUE}color:#B91C1C;">↓ ${brlSigned(metrics.totalOutCents, LedgerDirection.Out)}</p>
        </td>
        <td width="25%" style="${baseCard}background:#F8FAFC;border-color:#CBD5E1;">
          <p style="${SUMMARY_LABEL}">Saldo final do período</p>
          <p style="${SUMMARY_VALUE}color:#1E3A8A;">${brlNeutral(metrics.closingBalanceCents)}</p>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:10px 0 18px;">
      <tr>
        <td style="padding:0 2px;font-size:11px;color:#64748B;text-align:left;">${movementHint}</td>
      </tr>
    </table>`;
}

function buildDirectionIcon(isOut: boolean): string {
  const bg = isOut ? '#FEF2F2' : '#ECFDF5';
  const color = isOut ? '#B91C1C' : '#047857';
  const symbol = isOut ? '↓' : '↑';
  return `<span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:50%;background:${bg};color:${color};font-size:11px;font-weight:700;">${symbol}</span>`;
}

function buildMovements(metrics: ReturnType<typeof computeFreeBalanceExtratoMetrics>, periodLines: LedgerLine[]): string {
  const groups = groupLedgerLinesByMonth(periodLines);
  const th =
    `background:#F1F5F9;color:#475569;font-size:10px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;text-align:left;${CELL_PAD}`;
  const thNum = `${th}text-align:right;`;

  return groups
    .map((group, index) => {
      const withdrawals = monthWithdrawalsCents(group.lines);
      const subtotals = `Entradas R$ ${formatCentsAsBrl(group.depositsTotalCents)} · Saídas R$ ${formatCentsAsBrl(withdrawals)}`;
      const monthMargin = index === 0 ? 'margin-top:4px;' : 'margin-top:28px;';

      const rows = group.lines
        .map((line, rowIndex) => {
          const row = metrics.rowsByLineId.get(line.id);
          const isOut = line.direction === LedgerDirection.Out;
          const amountColor = isOut ? '#B91C1C' : '#047857';
          const zebra = rowIndex % 2 === 1 ? 'background:#F8FAFC;' : 'background:#ffffff;';
          const typeLabel = movementTypeLabelForDisplay(line.label, row?.movementType);
          const typeLine = typeLabel
            ? `<div style="margin-top:3px;font-size:10px;color:#64748B;line-height:1.3;">${escapeHtml(typeLabel)}</div>`
            : '';

          return `
            <tr style="${zebra}page-break-inside:avoid;break-inside:avoid;">
              <td width="13%" style="${CELL_PAD}color:#475569;font-variant-numeric:tabular-nums;border-top:1px solid #E2E8F0;vertical-align:middle;">
                ${formatCalendarDateBr(line.date)}
              </td>
              <td style="${CELL_PAD}border-top:1px solid #E2E8F0;vertical-align:middle;">
                <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                  <tr>
                    <td width="28" style="vertical-align:middle;padding-right:8px;">${buildDirectionIcon(isOut)}</td>
                    <td style="vertical-align:middle;">
                      <div style="color:#0F172A;font-size:12px;font-weight:500;line-height:1.35;">${escapeHtml(line.label)}</div>
                      ${typeLine}
                    </td>
                  </tr>
                </table>
              </td>
              <td width="22%" style="${CELL_PAD}text-align:right;color:${amountColor};border-top:1px solid #E2E8F0;vertical-align:middle;${TABLE_MONEY}">
                ${brlSigned(line.amountCents, line.direction)}
              </td>
              <td width="22%" style="${CELL_PAD}text-align:right;border-top:1px solid #E2E8F0;vertical-align:middle;${TABLE_BALANCE}">
                ${brlNeutral(row?.balanceAfterCents ?? 0)}
              </td>
            </tr>`;
        })
        .join('');

      return `
        <section style="${monthMargin}page-break-inside:avoid;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:10px;">
            <tr>
              <td style="font-size:14px;font-weight:700;color:#1E3A8A;">${escapeHtml(group.label)}</td>
              <td style="font-size:11px;color:#475569;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;">${subtotals}</td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" class="movements"
            style="border:1px solid #E2E8F0;border-radius:12px;border-collapse:separate;border-spacing:0;">
            <thead>
              <tr>
                <th width="13%" style="${th}">Data</th>
                <th style="${th}">Descrição</th>
                <th width="22%" style="${thNum}">Valor</th>
                <th width="22%" style="${thNum}">Saldo</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>`;
    })
    .join('');
}

export function buildFreeBalanceExtratoHtml(input: FreeBalanceExtratoDocumentInput): string {
  const brand = input.settings.businessName?.trim() || 'Demo In House Bank';
  const periodLabel = formatInstallmentDueDateRangeLabel(input.period);
  const issuedLabel = formatIssuedAtBr(input.issuedAt);
  const metrics = computeFreeBalanceExtratoMetrics({
    period: input.period,
    periodLines: input.periodLines,
    allLines: input.allLines,
    currentBalanceCents: input.currentBalanceCents,
  });

  const bodyContent =
    metrics.movementCount === 0
      ? `${buildSummaryCards(metrics)}
        <div style="margin-top:20px;border:1px dashed #E2E8F0;border-radius:12px;padding:28px;text-align:center;color:#475569;background:#F8FAFC;">
          Nenhuma movimentação neste período.
        </div>`
      : `${buildSummaryCards(metrics)}${buildMovements(metrics, input.periodLines)}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Extrato do saldo livre — ${escapeHtml(periodLabel)}</title>
    <style>${FREE_BALANCE_EXTRATO_CSS}</style>
  </head>
  <body style="margin:0;padding:14px 16px 20px;background:#ffffff;color:#0F172A;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
    <main style="width:100%;max-width:210mm;margin:0 auto;">
      ${buildHeader(brand, periodLabel, issuedLabel, input.settings.logoDataUrl)}
      ${bodyContent}
      <p style="margin:24px 0 0;padding-top:14px;border-top:1px solid #E2E8F0;color:#64748B;font-size:10px;line-height:1.5;page-break-inside:avoid;">
        O In House Bank é apenas uma ferramenta de controle financeiro. Não movimenta dinheiro e não é meio de pagamento.
        Este extrato não tem valor como comprovante bancário.
      </p>
    </main>
  </body>
</html>`;
}
