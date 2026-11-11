import type { CashBoxMovementType } from '../enums/cash-box-movement-type';
import type { CalendarDate } from './calendar-date';

export interface CashBoxMovement {
  id: string;
  cashBoxId: string;
  type: CashBoxMovementType;
  amountCents: number;
  date: CalendarDate;
  note?: string;
  recordedAt?: string;
}
