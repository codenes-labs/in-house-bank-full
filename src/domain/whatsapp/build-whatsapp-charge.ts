import { formatCentsAsBrl } from '../money/brl-input';
import { formatCalendarDateBr } from '../pdf/format-calendar-date-br';
import { buildStaticPixBrCode } from '../pix/build-static-pix-br-code';
import type { Installment } from '../models/installment';
import type { InstallmentPlan } from '../models/installment-plan';
import type { Settings } from '../models/settings';
import { DEFAULT_WHATSAPP_MESSAGE } from './default-whatsapp-message';

export interface WhatsappChargeInput {
  plan: InstallmentPlan;
  installment: Installment;
  settings: Settings;
  template?: string;
}

export function renderWhatsappTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{([a-z]+)\}/gi, (token, name: string) => {
    const value = variables[name.toLowerCase()];
    return value ?? token;
  });
}

export function buildWhatsappChargeMessage(input: WhatsappChargeInput): string {
  const pix = buildStaticPixBrCode({
    pixKey: input.plan.pixKey,
    amountCents: input.installment.amountCents,
    merchantName: input.plan.beneficiary,
    merchantCity: input.settings.city,
    txid: input.installment.txid,
  });
  const template = input.template?.trim() || input.settings.whatsappMessageTemplate?.trim() || DEFAULT_WHATSAPP_MESSAGE;
  return renderWhatsappTemplate(template, {
    pagador: input.plan.borrowerName,
    valor: `R$ ${formatCentsAsBrl(input.installment.amountCents)}`,
    vencimento: formatCalendarDateBr(input.installment.dueDate),
    pix,
    parcela: String(input.installment.number),
    referencia: input.plan.reference,
  });
}

export function buildWhatsappUrl(nationalDigits: string, message: string): string {
  return `https://wa.me/55${nationalDigits}?text=${encodeURIComponent(message)}`;
}
