export interface CashBox {
  id: string;
  name: string;
  institution: string;
  cdiPercent: number;
  limitCents?: number;
  balanceCents: number;
}
