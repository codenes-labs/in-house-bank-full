import type { CalendarDate } from './calendar-date';

export interface Installment {
  id: string;
  planId: string;
  number: number;
  dueDate: CalendarDate;
  amountCents: number;
  paidDate?: CalendarDate;
  txid: string;
}
