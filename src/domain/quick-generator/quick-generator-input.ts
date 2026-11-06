import type { InstallmentPlanType } from '../enums/installment-plan-type';
import type { CalendarDate } from '../models/calendar-date';

export interface QuickGeneratorInput {
  usedAmountCents: number;
  returnAmountCents: number;
  type: InstallmentPlanType;
  reference: string;
  borrowerName: string;
  issueDate: CalendarDate;
  firstDueDate: CalendarDate;
  installmentsCount: number;
  pixKey: string;
  beneficiary: string;
  institution: string;
  cardPriceCents?: number;
}
