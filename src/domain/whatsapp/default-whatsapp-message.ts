export const DEFAULT_WHATSAPP_MESSAGE =
  'Olá, {pagador}. A parcela {parcela} da referência {referencia}, no valor de {valor}, vence em {vencimento}. Pix copia e cola: {pix}';

export const WHATSAPP_MESSAGE_TAGS = [
  'pagador',
  'parcela',
  'referencia',
  'valor',
  'vencimento',
  'pix',
] as const;
