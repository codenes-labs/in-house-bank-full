import type { InstallmentPlanType } from '../enums/installment-plan-type';
import type { CalendarDate } from './calendar-date';

export interface InstallmentPlan {
  id: string;
  type: InstallmentPlanType;
  reference: string;
  borrowerName: string;
  usedAmountCents: number;
  returnAmountCents: number;
  issueDate: CalendarDate;
  firstDueDate: CalendarDate;
  installmentsCount: number;
  pixKey: string;
  beneficiary: string;
  institution: string;
  /** Optional comparison price for R10 (card/loan). */
  cardPriceCents?: number;
  payerPhone?: string;
  paymentInstructions?: string;
  responsibilityTerm?: string;
  createdAt: string;
}
