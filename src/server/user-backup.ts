import type { NeonQueryFunction } from '@neondatabase/serverless';
import type { AppDataBackup } from '../domain/models/app-data-backup';
import type { CashBox } from '../domain/models/cash-box';
import type { CashBoxMovement } from '../domain/models/cash-box-movement';
import { buildCashBoxTransferDeposit } from '../domain/cash-boxes/build-cash-box-transfer-deposit';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { createId } from '../domain/ids/create-id';
import type { FreeBalanceDeposit } from '../domain/models/free-balance-deposit';
import type { FreeBalanceWithdrawal } from '../domain/models/free-balance-withdrawal';
import { mapCashBox, type Row } from './rows';
import type { Installment } from '../domain/models/installment';
import type { InstallmentPlan } from '../domain/models/installment-plan';
import type { Settings } from '../domain/models/settings';

type Sql = NeonQueryFunction<false, false>;

export async function replaceUserBackup(sql: Sql, userId: string, backup: AppDataBackup): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`delete from free_balance_deposits where user_id = ${userId}::uuid`,
    sql`delete from free_balance_withdrawals where user_id = ${userId}::uuid`,
    sql`delete from cash_box_movements where user_id = ${userId}::uuid`,
    sql`delete from installments where user_id = ${userId}::uuid`,
    sql`delete from installment_plans where user_id = ${userId}::uuid`,
    sql`delete from cash_boxes where user_id = ${userId}::uuid`,
  ]);
  await saveSettings(sql, userId, backup.settings);
  for (const plan of backup.installmentPlans) {
    await savePlan(sql, userId, plan);
  }
  for (const installment of backup.installments) {
    await saveInstallment(sql, userId, installment);
  }
  for (const cashBox of backup.cashBoxes) {
    await saveCashBox(sql, userId, cashBox);
  }
  for (const movement of backup.cashBoxMovements) {
    await saveMovement(sql, userId, movement);
  }
  for (const withdrawal of backup.freeBalanceWithdrawals) {
    await insertFreeBalanceWithdrawal(sql, userId, withdrawal);
  }
  for (const deposit of backup.freeBalanceDeposits ?? []) {
    await insertFreeBalanceDeposit(sql, userId, deposit);
  }
}

export async function saveSettings(sql: Sql, userId: string, settings: Settings): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`insert into settings (
      user_id, business_name, document, city, default_pix_key, default_institution,
      default_installments, default_due_day, default_interest_type, theme, cdi_annual_percent,
      milestones_cents, free_balance_cents, pdf_footer_text, payment_instructions,
      responsibility_term, whatsapp_message_template, logo_data_url, updated_at
    ) values (
      ${userId}::uuid, ${settings.businessName}, ${settings.document ?? null}, ${settings.city},
      ${settings.defaultPixKey}, ${settings.defaultInstitution}, ${settings.defaultInstallments},
      ${settings.defaultDueDay ?? null}, ${settings.defaultInterestType}, ${settings.theme},
      ${settings.cdiAnnualPercent}, ${JSON.stringify(settings.milestonesCents)}::jsonb,
      ${settings.freeBalanceCents}, ${settings.pdfFooterText ?? null}, ${settings.paymentInstructions ?? null},
      ${settings.responsibilityTerm ?? null}, ${settings.whatsappMessageTemplate ?? null},
      ${settings.logoDataUrl ?? null}, now()
    )
    on conflict (user_id) do update set
      business_name = excluded.business_name,
      document = excluded.document,
      city = excluded.city,
      default_pix_key = excluded.default_pix_key,
      default_institution = excluded.default_institution,
      default_installments = excluded.default_installments,
      default_due_day = excluded.default_due_day,
      default_interest_type = excluded.default_interest_type,
      theme = excluded.theme,
      cdi_annual_percent = excluded.cdi_annual_percent,
      milestones_cents = excluded.milestones_cents,
      free_balance_cents = excluded.free_balance_cents,
      pdf_footer_text = excluded.pdf_footer_text,
      payment_instructions = excluded.payment_instructions,
      responsibility_term = excluded.responsibility_term,
      whatsapp_message_template = excluded.whatsapp_message_template,
      logo_data_url = excluded.logo_data_url,
      updated_at = now()`,
  ]);
}

export async function savePlan(sql: Sql, userId: string, plan: InstallmentPlan): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`insert into installment_plans (
      id, user_id, type, reference, borrower_name, used_amount_cents, return_amount_cents,
      issue_date, first_due_date, installments_count, pix_key, beneficiary, institution,
      card_price_cents, payer_phone, payment_instructions, responsibility_term, created_at
    ) values (
      ${plan.id}::uuid, ${userId}::uuid, ${plan.type}, ${plan.reference}, ${plan.borrowerName},
      ${plan.usedAmountCents}, ${plan.returnAmountCents}, ${plan.issueDate}, ${plan.firstDueDate},
      ${plan.installmentsCount}, ${plan.pixKey}, ${plan.beneficiary}, ${plan.institution},
      ${plan.cardPriceCents ?? null}, ${plan.payerPhone ?? null}, ${plan.paymentInstructions ?? null},
      ${plan.responsibilityTerm ?? null}, ${plan.createdAt}
    )
    on conflict (id) do update set
      type = excluded.type,
      reference = excluded.reference,
      borrower_name = excluded.borrower_name,
      used_amount_cents = excluded.used_amount_cents,
      return_amount_cents = excluded.return_amount_cents,
      issue_date = excluded.issue_date,
      first_due_date = excluded.first_due_date,
      installments_count = excluded.installments_count,
      pix_key = excluded.pix_key,
      beneficiary = excluded.beneficiary,
      institution = excluded.institution,
      card_price_cents = excluded.card_price_cents,
      payer_phone = excluded.payer_phone,
      payment_instructions = excluded.payment_instructions,
      responsibility_term = excluded.responsibility_term
    where installment_plans.user_id = ${userId}::uuid`,
  ]);
}

export async function saveInstallment(sql: Sql, userId: string, installment: Installment): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`insert into installments (id, user_id, plan_id, number, due_date, amount_cents, paid_date, txid)
    values (
      ${installment.id}::uuid, ${userId}::uuid, ${installment.planId}::uuid, ${installment.number},
      ${installment.dueDate}, ${installment.amountCents}, ${installment.paidDate ?? null}, ${installment.txid}
    )
    on conflict (id) do update set
      number = excluded.number,
      due_date = excluded.due_date,
      amount_cents = excluded.amount_cents,
      paid_date = excluded.paid_date,
      txid = excluded.txid
    where installments.user_id = ${userId}::uuid`,
  ]);
}

export async function saveCashBox(sql: Sql, userId: string, cashBox: CashBox): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`insert into cash_boxes (id, user_id, name, institution, cdi_percent, limit_cents, balance_cents)
    values (
      ${cashBox.id}::uuid, ${userId}::uuid, ${cashBox.name}, ${cashBox.institution},
      ${cashBox.cdiPercent}, ${cashBox.limitCents ?? null}, ${cashBox.balanceCents}
    )
    on conflict (id) do update set
      name = excluded.name,
      institution = excluded.institution,
      cdi_percent = excluded.cdi_percent,
      limit_cents = excluded.limit_cents,
      balance_cents = excluded.balance_cents
    where cash_boxes.user_id = ${userId}::uuid`,
  ]);
}

export async function saveFreeBalanceDeposit(
  sql: Sql,
  userId: string,
  deposit: FreeBalanceDeposit,
  settings: Settings,
): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`
      insert into free_balance_deposits (id, user_id, amount_cents, deposit_date, note, recorded_at)
      values (
        ${deposit.id}::uuid,
        ${userId}::uuid,
        ${deposit.amountCents},
        ${deposit.date},
        ${deposit.note ?? null},
        ${deposit.recordedAt ?? null}
      )
      on conflict (id) do update set
        amount_cents = excluded.amount_cents,
        deposit_date = excluded.deposit_date,
        note = excluded.note,
        recorded_at = excluded.recorded_at
      where free_balance_deposits.user_id = ${userId}::uuid
    `,
    sql`
      update settings
      set free_balance_cents = ${settings.freeBalanceCents}, updated_at = now()
      where user_id = ${userId}::uuid
    `,
  ]);
}

export async function saveFreeBalanceWithdrawal(
  sql: Sql,
  userId: string,
  withdrawal: FreeBalanceWithdrawal,
  settings: Settings,
): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`
      insert into free_balance_withdrawals (id, user_id, amount_cents, withdrawal_date, note, recorded_at)
      values (
        ${withdrawal.id}::uuid,
        ${userId}::uuid,
        ${withdrawal.amountCents},
        ${withdrawal.date},
        ${withdrawal.note ?? null},
        ${withdrawal.recordedAt ?? null}
      )
      on conflict (id) do update set
        amount_cents = excluded.amount_cents,
        withdrawal_date = excluded.withdrawal_date,
        note = excluded.note,
        recorded_at = excluded.recorded_at
      where free_balance_withdrawals.user_id = ${userId}::uuid
    `,
    sql`
      update settings
      set free_balance_cents = ${settings.freeBalanceCents}, updated_at = now()
      where user_id = ${userId}::uuid
    `,
  ]);
}

async function insertFreeBalanceDeposit(sql: Sql, userId: string, deposit: FreeBalanceDeposit): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`
      insert into free_balance_deposits (id, user_id, amount_cents, deposit_date, note, recorded_at)
      values (
        ${deposit.id}::uuid,
        ${userId}::uuid,
        ${deposit.amountCents},
        ${deposit.date},
        ${deposit.note ?? null},
        ${deposit.recordedAt ?? null}
      )
      on conflict (id) do update set
        amount_cents = excluded.amount_cents,
        deposit_date = excluded.deposit_date,
        note = excluded.note,
        recorded_at = excluded.recorded_at
      where free_balance_deposits.user_id = ${userId}::uuid
    `,
  ]);
}

async function insertFreeBalanceWithdrawal(
  sql: Sql,
  userId: string,
  withdrawal: FreeBalanceWithdrawal,
): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`
      insert into free_balance_withdrawals (id, user_id, amount_cents, withdrawal_date, note, recorded_at)
      values (
        ${withdrawal.id}::uuid,
        ${userId}::uuid,
        ${withdrawal.amountCents},
        ${withdrawal.date},
        ${withdrawal.note ?? null},
        ${withdrawal.recordedAt ?? null}
      )
      on conflict (id) do update set
        amount_cents = excluded.amount_cents,
        withdrawal_date = excluded.withdrawal_date,
        note = excluded.note,
        recorded_at = excluded.recorded_at
      where free_balance_withdrawals.user_id = ${userId}::uuid
    `,
  ]);
}

export async function saveMovement(sql: Sql, userId: string, movement: CashBoxMovement): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`insert into cash_box_movements (id, user_id, cash_box_id, type, amount_cents, movement_date, note, recorded_at)
    values (
      ${movement.id}::uuid, ${userId}::uuid, ${movement.cashBoxId}::uuid, ${movement.type},
      ${movement.amountCents}, ${movement.date}, ${movement.note ?? null}, ${movement.recordedAt ?? null}
    )
    on conflict (id) do update set
      type = excluded.type,
      amount_cents = excluded.amount_cents,
      movement_date = excluded.movement_date,
      note = excluded.note,
      recorded_at = excluded.recorded_at
    where cash_box_movements.user_id = ${userId}::uuid`,
  ]);
}

export async function deleteCashBox(sql: Sql, userId: string, cashBoxId: string): Promise<void> {
  const lookup = await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`
      select id, name, institution, cdi_percent, limit_cents, balance_cents
      from cash_boxes
      where id = ${cashBoxId}::uuid and user_id = ${userId}::uuid
    `,
  ]);
  const row = (lookup[1] as Row[])[0];
  const cashBox = row ? mapCashBox(row) : undefined;
  const deposit = cashBox ? buildCashBoxTransferDeposit(cashBox, createId(), todayCalendarDate()) : null;

  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    ...(deposit
      ? [
          sql`
            insert into free_balance_deposits (id, user_id, amount_cents, deposit_date, note, recorded_at)
            values (
              ${deposit.id}::uuid,
              ${userId}::uuid,
              ${deposit.amountCents},
              ${deposit.date},
              ${deposit.note ?? null},
              ${deposit.recordedAt ?? null}
            )
          `,
        ]
      : []),
    sql`
      update settings
      set
        free_balance_cents = free_balance_cents + coalesce(
          (select balance_cents from cash_boxes where id = ${cashBoxId}::uuid and user_id = ${userId}::uuid),
          0
        ),
        updated_at = now()
      where user_id = ${userId}::uuid
    `,
    sql`delete from cash_box_movements where cash_box_id = ${cashBoxId}::uuid and user_id = ${userId}::uuid`,
    sql`delete from cash_boxes where id = ${cashBoxId}::uuid and user_id = ${userId}::uuid`,
  ]);
}

export async function removeRow(
  sql: Sql,
  userId: string,
  table: 'installment_plans' | 'installments' | 'cash_boxes' | 'cash_box_movements',
  id: string,
): Promise<void> {
  await sql.transaction([
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`delete from ${sql.unsafe(table)} where id = ${id}::uuid and user_id = ${userId}::uuid`,
  ]);
}
