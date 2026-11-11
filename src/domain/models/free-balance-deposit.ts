import type { CalendarDate } from './calendar-date';

export interface FreeBalanceDeposit {
  id: string;
  amountCents: number;
  date: CalendarDate;
  note?: string;
  recordedAt?: string;
}
