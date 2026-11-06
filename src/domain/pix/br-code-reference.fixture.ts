/** Decoded from `in-house-bank_prototipo.pdf` (RN-08 reference). */
export const PROTOTYPE_STATIC_PIX_BR_CODE =
  '00020126580014BR.GOV.BCB.PIX013631b6c1ca-b977-42e8-9ae5-99a93ba06edb5204000053039865406149.755802BR5917Wesley Nunes Lima6009SAO PAULO62140510lStHtriLg86304FC79';

export const PROTOTYPE_PAYLOAD_FOR_CRC = PROTOTYPE_STATIC_PIX_BR_CODE.slice(0, -4);

export const PROTOTYPE_PIX_INPUT = {
  pixKey: '31b6c1ca-b977-42e8-9ae5-99a93ba06edb',
  amountCents: 14_975,
  merchantName: 'Wesley Nunes Lima',
  merchantCity: 'SAO PAULO',
  txid: 'lStHtriLg8',
} as const;
