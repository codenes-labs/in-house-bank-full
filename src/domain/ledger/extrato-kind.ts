export const ExtratoKind = {
  Payables: 'PAYABLES',
  Receivables: 'RECEIVABLES',
  Installments: 'INSTALLMENTS',
  CashBox: 'CASH_BOX',
  FreeBalance: 'FREE_BALANCE',
} as const;

export type ExtratoKind = (typeof ExtratoKind)[keyof typeof ExtratoKind];

export const EXTRATO_KIND_OPTIONS: readonly { value: ExtratoKind; label: string }[] = [
  { value: ExtratoKind.Payables, label: 'Contas a pagar' },
  { value: ExtratoKind.Receivables, label: 'Contas a receber' },
  { value: ExtratoKind.Installments, label: 'Parcelamento' },
  { value: ExtratoKind.CashBox, label: 'Caixinha' },
  { value: ExtratoKind.FreeBalance, label: 'Saldo livre' },
];

export function parseExtratoKind(raw: string | null): ExtratoKind {
  const match = EXTRATO_KIND_OPTIONS.find((option) => option.value === raw);
  return match?.value ?? ExtratoKind.Installments;
}
