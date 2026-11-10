import { DefaultInterestType } from '../enums/default-interest-type';
import type { Settings } from '../models/settings';

export const DEMO_PRESENTATION_DEFAULT_INSTALLMENTS = 4;
export const DEMO_PRESENTATION_DEFAULT_DUE_DAY = 10;

export const DEMO_PRESENTATION_PAYMENT_INSTRUCTIONS = 'Pix copia e cola gerado só para treino.';

export const DEMO_PRESENTATION_RESPONSIBILITY_TERM = '';

export const DEMO_PRESENTATION_WHATSAPP_MESSAGE = [
  'Olá, {pagador}.',
  '',
  'Encaminhamos a cobrança da {parcela}, referente a {referencia}, no valor de {valor}, com vencimento em {vencimento}.',
  '',
  'Pix copia e cola:',
  '{pix}',
  '',
  'Permanecemos à disposição para esclarecimentos.',
  '',
  'Atenciosamente,',
  'Demonstração — In House Bank',
].join('\n');

export const DEMO_PRESENTATION_PDF_FOOTER = DEMO_PRESENTATION_PAYMENT_INSTRUCTIONS;

export function demoPresentationCarneTexts(): Pick<
  Settings,
  'paymentInstructions' | 'responsibilityTerm' | 'whatsappMessageTemplate' | 'pdfFooterText'
> {
  return {
    paymentInstructions: DEMO_PRESENTATION_PAYMENT_INSTRUCTIONS,
    responsibilityTerm: DEMO_PRESENTATION_RESPONSIBILITY_TERM,
    whatsappMessageTemplate: DEMO_PRESENTATION_WHATSAPP_MESSAGE,
    pdfFooterText: DEMO_PRESENTATION_PDF_FOOTER,
  };
}

export function demoPresentationInstallmentDefaults(): Pick<
  Settings,
  'defaultInstallments' | 'defaultDueDay' | 'defaultInterestType'
> {
  return {
    defaultInstallments: DEMO_PRESENTATION_DEFAULT_INSTALLMENTS,
    defaultDueDay: DEMO_PRESENTATION_DEFAULT_DUE_DAY,
    defaultInterestType: DefaultInterestType.Simple,
  };
}

export function settingsNeedDemoPresentationTexts(settings: Settings): boolean {
  const demo = demoPresentationCarneTexts();
  return (
    (settings.paymentInstructions ?? '').trim() !== demo.paymentInstructions ||
    (settings.responsibilityTerm ?? '').trim() !== (demo.responsibilityTerm ?? '').trim() ||
    (settings.whatsappMessageTemplate ?? '').trim() !== demo.whatsappMessageTemplate ||
    (settings.pdfFooterText ?? '').trim() !== demo.pdfFooterText
  );
}

export function settingsNeedDemoInstallmentDefaults(settings: Settings): boolean {
  const defaults = demoPresentationInstallmentDefaults();
  return (
    settings.defaultInstallments !== defaults.defaultInstallments ||
    settings.defaultDueDay !== defaults.defaultDueDay ||
    settings.defaultInterestType !== defaults.defaultInterestType
  );
}
