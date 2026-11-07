import type { CalendarDate } from '../models/calendar-date';
import type { ExtratoKind } from './extrato-kind';
import type { LedgerDirection } from './ledger-direction';

export interface LedgerLine {
  id: string;
  date: CalendarDate;
  label: string;
  amountCents: number;
  direction: LedgerDirection;
  kind: ExtratoKind;
}
