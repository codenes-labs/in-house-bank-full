import type { SupabaseClient } from '@supabase/supabase-js';
import { DefaultInterestType } from '../domain/enums/default-interest-type';
import type { AppDataBackup } from '../domain/models/app-data-backup';
import type { CashBox } from '../domain/models/cash-box';
import type { CashBoxMovement } from '../domain/models/cash-box-movement';
import type { Installment } from '../domain/models/installment';
import type { InstallmentPlan } from '../domain/models/installment-plan';
import { createEmptySettings, type Settings } from '../domain/models/settings';
import { parseStoredThemeMode } from '../domain/theme/theme-mode';
import type { BankRepository, BankSnapshot } from './bank-repository';

type Row = Record<string, unknown>;

export function createSupabaseBankRepository(
  client: SupabaseClient,
  userId: string,
): BankRepository {
  return {
    async load() {
      const [settings, plans, installments, cashBoxes, movements] = await Promise.all([
        client.from('settings').select('*').eq('user_id', userId).maybeSingle(),
        client.from('installment_plans').select('*').eq('user_id', userId),
        client.from('installments').select('*').eq('user_id', userId),
        client.from('cash_boxes').select('*').eq('user_id', userId),
        client.from('cash_box_movements').select('*').eq('user_id', userId),
      ]);
      assertOk(settings.error);
      assertOk(plans.error);
      assertOk(installments.error);
      assertOk(cashBoxes.error);
      assertOk(movements.error);
      return {
        settings: settings.data ? mapSettings(settings.data as Row) : createEmptySettings(),
        installmentPlans: ((plans.data ?? []) as Row[]).map(mapPlan),
        installments: ((installments.data ?? []) as Row[]).map(mapInstallment),
        cashBoxes: ((cashBoxes.data ?? []) as Row[]).map(mapCashBox),
        cashBoxMovements: ((movements.data ?? []) as Row[]).map(mapMovement),
      } satisfies BankSnapshot;
    },
    async saveSettings(settings) {
      const { error } = await client.from('settings').upsert(settingsToRow(settings, userId));
      assertOk(error);
    },
    async savePlan(plan) {
      const { error } = await client.from('installment_plans').upsert(planToRow(plan, userId));
      assertOk(error);
    },
    async deletePlan(planId) {
      const { error } = await client.from('installment_plans').delete().eq('id', planId).eq('user_id', userId);
      assertOk(error);
    },
    async saveInstallment(installment) {
      const { error } = await client.from('installments').upsert(installmentToRow(installment, userId));
      assertOk(error);
    },
    async deleteInstallment(installmentId) {
      const { error } = await client.from('installments').delete().eq('id', installmentId).eq('user_id', userId);
      assertOk(error);
    },
    async saveCashBox(cashBox) {
      const { error } = await client.from('cash_boxes').upsert(cashBoxToRow(cashBox, userId));
      assertOk(error);
    },
    async deleteCashBox(cashBoxId) {
      const { error } = await client.from('cash_boxes').delete().eq('id', cashBoxId).eq('user_id', userId);
      assertOk(error);
    },
    async saveMovement(movement) {
      const { error } = await client.from('cash_box_movements').upsert(movementToRow(movement, userId));
      assertOk(error);
    },
    async deleteMovement(movementId) {
      const { error } = await client.from('cash_box_movements').delete().eq('id', movementId).eq('user_id', userId);
      assertOk(error);
    },
    async importBackup(backup: AppDataBackup) {
      await deleteOwn(client, 'cash_box_movements', userId);
      await deleteOwn(client, 'installments', userId);
      await deleteOwn(client, 'installment_plans', userId);
      await deleteOwn(client, 'cash_boxes', userId);
      await this.saveSettings(backup.settings);
      for (const plan of backup.installmentPlans) {
        await this.savePlan(plan);
      }
      for (const installment of backup.installments) {
        await this.saveInstallment(installment);
      }
      for (const cashBox of backup.cashBoxes) {
        await this.saveCashBox(cashBox);
      }
      for (const movement of backup.cashBoxMovements) {
        await this.saveMovement(movement);
      }
    },
  };
}

async function deleteOwn(client: SupabaseClient, table: string, userId: string): Promise<void> {
  const { error } = await client.from(table).delete().eq('user_id', userId);
  assertOk(error);
}

function assertOk(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function asNumber(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function asDate(value: unknown): string {
  return String(value).slice(0, 10);
}

function mapSettings(row: Row): Settings {
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

function settingsToRow(settings: Settings, userId: string): Row {
  return {
    user_id: userId,
    business_name: settings.businessName,
    document: settings.document ?? null,
    city: settings.city,
    default_pix_key: settings.defaultPixKey,
    default_institution: settings.defaultInstitution,
    default_installments: settings.defaultInstallments,
    default_due_day: settings.defaultDueDay ?? null,
    default_interest_type: settings.defaultInterestType,
    theme: settings.theme,
    cdi_annual_percent: settings.cdiAnnualPercent,
    milestones_cents: settings.milestonesCents,
    free_balance_cents: settings.freeBalanceCents,
    pdf_footer_text: settings.pdfFooterText ?? null,
    payment_instructions: settings.paymentInstructions ?? null,
    responsibility_term: settings.responsibilityTerm ?? null,
    whatsapp_message_template: settings.whatsappMessageTemplate ?? null,
    logo_data_url: settings.logoDataUrl ?? null,
    updated_at: new Date().toISOString(),
  };
}

function mapPlan(row: Row): InstallmentPlan {
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
    createdAt: String(row['created_at']),
  };
}

function planToRow(plan: InstallmentPlan, userId: string): Row {
  return {
    id: plan.id,
    user_id: userId,
    type: plan.type,
    reference: plan.reference,
    borrower_name: plan.borrowerName,
    used_amount_cents: plan.usedAmountCents,
    return_amount_cents: plan.returnAmountCents,
    issue_date: plan.issueDate,
    first_due_date: plan.firstDueDate,
    installments_count: plan.installmentsCount,
    pix_key: plan.pixKey,
    beneficiary: plan.beneficiary,
    institution: plan.institution,
    card_price_cents: plan.cardPriceCents ?? null,
    payer_phone: plan.payerPhone ?? null,
    payment_instructions: plan.paymentInstructions ?? null,
    responsibility_term: plan.responsibilityTerm ?? null,
    created_at: plan.createdAt,
  };
}

function mapInstallment(row: Row): Installment {
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

function installmentToRow(installment: Installment, userId: string): Row {
  return {
    id: installment.id,
    user_id: userId,
    plan_id: installment.planId,
    number: installment.number,
    due_date: installment.dueDate,
    amount_cents: installment.amountCents,
    paid_date: installment.paidDate ?? null,
    txid: installment.txid,
  };
}

function mapCashBox(row: Row): CashBox {
  return {
    id: String(row['id']),
    name: String(row['name']),
    institution: String(row['institution']),
    cdiPercent: asNumber(row['cdi_percent']),
    limitCents: row['limit_cents'] == null ? undefined : asNumber(row['limit_cents']),
    balanceCents: asNumber(row['balance_cents']),
  };
}

function cashBoxToRow(cashBox: CashBox, userId: string): Row {
  return {
    id: cashBox.id,
    user_id: userId,
    name: cashBox.name,
    institution: cashBox.institution,
    cdi_percent: cashBox.cdiPercent,
    limit_cents: cashBox.limitCents ?? null,
    balance_cents: cashBox.balanceCents,
  };
}

function mapMovement(row: Row): CashBoxMovement {
  return {
    id: String(row['id']),
    cashBoxId: String(row['cash_box_id']),
    type: row['type'] as CashBoxMovement['type'],
    amountCents: asNumber(row['amount_cents']),
    date: asDate(row['movement_date']),
    note: optionalText(row['note']),
  };
}

function movementToRow(movement: CashBoxMovement, userId: string): Row {
  return {
    id: movement.id,
    user_id: userId,
    cash_box_id: movement.cashBoxId,
    type: movement.type,
    amount_cents: movement.amountCents,
    movement_date: movement.date,
    note: movement.note ?? null,
  };
}
