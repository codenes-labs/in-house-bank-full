import type { CalendarDate } from './calendar-date';

export interface FreeBalanceWithdrawal {
  id: string;
  amountCents: number;
  date: CalendarDate;
  note?: string;
  recordedAt?: string;
}
