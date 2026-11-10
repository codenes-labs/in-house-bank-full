import { DefaultInterestType } from '../domain/enums/default-interest-type';
import type { CashBox } from '../domain/models/cash-box';
import type { CashBoxMovement } from '../domain/models/cash-box-movement';
import type { FreeBalanceDeposit } from '../domain/models/free-balance-deposit';
import type { FreeBalanceWithdrawal } from '../domain/models/free-balance-withdrawal';
import type { Installment } from '../domain/models/installment';
import type { InstallmentPlan } from '../domain/models/installment-plan';
import type { Settings } from '../domain/models/settings';
import { parseStoredThemeMode } from '../domain/theme/theme-mode';

export type Row = Record<string, unknown>;

export function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function asNumber(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function asDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

export function asTimestamp(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

export function mapSettings(row: Row): Settings {
  const interest = row['default_interest_type'];
  const milestones = row['milestones_cents'];
  return {
    businessName: String(row['business_name'] ?? ''),
    document: optionalText(row['document']),
    city: String(row['city'] ?? ''),
    defaultPixKey: String(row['default_pix_key'] ?? ''),
    defaultInstitution: String(row['default_institution'] ?? ''),
    defaultInstallments: asNumber(row['default_installments']) || 1,
    defaultDueDay: row['default_due_day'] == null ? undefined : asNumber(row['default_due_day']),
    defaultInterestType:
      interest === DefaultInterestType.Compound ? DefaultInterestType.Compound : DefaultInterestType.Simple,
    theme: parseStoredThemeMode(typeof row['theme'] === 'string' ? row['theme'] : null),
    cdiAnnualPercent: asNumber(row['cdi_annual_percent']),
    milestonesCents: Array.isArray(milestones) ? milestones.map(asNumber) : [],
    freeBalanceCents: asNumber(row['free_balance_cents']),
    pdfFooterText: optionalText(row['pdf_footer_text']),
    paymentInstructions: optionalText(row['payment_instructions']),
    responsibilityTerm: optionalText(row['responsibility_term']),
    whatsappMessageTemplate: optionalText(row['whatsapp_message_template']),
    logoDataUrl: optionalText(row['logo_data_url']),
  };
}

export function mapPlan(row: Row): InstallmentPlan {
  return {
    id: String(row['id']),
    type: row['type'] as InstallmentPlan['type'],
    reference: String(row['reference']),
    borrowerName: String(row['borrower_name']),
    usedAmountCents: asNumber(row['used_amount_cents']),
    returnAmountCents: asNumber(row['return_amount_cents']),
    issueDate: asDate(row['issue_date']),
    firstDueDate: asDate(row['first_due_date']),
    installmentsCount: asNumber(row['installments_count']),
    pixKey: String(row['pix_key']),
    beneficiary: String(row['beneficiary']),
    institution: String(row['institution']),
    cardPriceCents: row['card_price_cents'] == null ? undefined : asNumber(row['card_price_cents']),
    payerPhone: optionalText(row['payer_phone']),
    paymentInstructions: optionalText(row['payment_instructions']),
    responsibilityTerm: optionalText(row['responsibility_term']),
    createdAt: asTimestamp(row['created_at']),
  };
}

export function mapInstallment(row: Row): Installment {
  return {
    id: String(row['id']),
    planId: String(row['plan_id']),
    number: asNumber(row['number']),
    dueDate: asDate(row['due_date']),
    amountCents: asNumber(row['amount_cents']),
    paidDate: row['paid_date'] == null ? undefined : asDate(row['paid_date']),
    txid: String(row['txid']),
  };
}

export function mapCashBox(row: Row): CashBox {
  return {
    id: String(row['id']),
    name: String(row['name']),
    institution: String(row['institution']),
    cdiPercent: asNumber(row['cdi_percent']),
    limitCents: row['limit_cents'] == null ? undefined : asNumber(row['limit_cents']),
    balanceCents: asNumber(row['balance_cents']),
  };
}

export function mapMovement(row: Row): CashBoxMovement {
  return {
    id: String(row['id']),
    cashBoxId: String(row['cash_box_id']),
    type: row['type'] as CashBoxMovement['type'],
    amountCents: asNumber(row['amount_cents']),
    date: asDate(row['movement_date']),
    note: optionalText(row['note']),
  };
}

export function mapFreeBalanceWithdrawal(row: Row): FreeBalanceWithdrawal {
  return {
    id: String(row['id']),
    amountCents: asNumber(row['amount_cents']),
    date: asDate(row['withdrawal_date']),
    note: optionalText(row['note']),
  };
}

export function mapFreeBalanceDeposit(row: Row): FreeBalanceDeposit {
  return {
    id: String(row['id']),
    amountCents: asNumber(row['amount_cents']),
    date: asDate(row['deposit_date']),
    note: optionalText(row['note']),
  };
}
