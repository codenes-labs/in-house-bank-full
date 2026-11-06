import type { PlanStatus } from '../enums/plan-status';
import type { Installment } from '../models/installment';
import type { InstallmentPlan } from '../models/installment-plan';

export interface InstallmentPlanListRow {
  plan: InstallmentPlan;
  installments: Installment[];
  paidCount: number;
  expectedProfitCents: number;
  planStatus: PlanStatus;
}
