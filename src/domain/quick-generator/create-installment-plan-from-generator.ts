import { createId } from '../ids/create-id';
import { buildInstallmentDrafts } from '../installments/build-installment-drafts';
import { buildInstallmentTxid } from '../installments/build-installment-txid';
import type { Installment } from '../models/installment';
import type { InstallmentPlan } from '../models/installment-plan';
import { validatePixKey } from '../pix/validate-pix-key';
import type { QuickGeneratorInput } from './quick-generator-input';
import { validateQuickGenerator } from './validate-quick-generator';

export interface GeneratedInstallmentPlanBundle {
  plan: InstallmentPlan;
  installments: Installment[];
}

export function createInstallmentPlanBundle(
  input: QuickGeneratorInput,
  planId: string,
  createdAt: string,
): GeneratedInstallmentPlanBundle {
  const validation = validateQuickGenerator(input);
  if (!validation.valid) {
    throw new Error('Generator input is invalid');
  }

  const pixKey = validatePixKey(input.pixKey).normalizedKey ?? input.pixKey.trim();
  const drafts = buildInstallmentDrafts(
    input.returnAmountCents,
    input.installmentsCount,
    input.firstDueDate,
  );

  const plan: InstallmentPlan = {
    id: planId,
    type: input.type,
    reference: input.reference.trim(),
    borrowerName: input.borrowerName.trim(),
    usedAmountCents: input.usedAmountCents,
    returnAmountCents: input.returnAmountCents,
    issueDate: input.issueDate,
    firstDueDate: input.firstDueDate,
    installmentsCount: input.installmentsCount,
    pixKey,
    beneficiary: input.beneficiary.trim(),
    institution: input.institution.trim(),
    cardPriceCents: input.cardPriceCents,
    createdAt,
  };

  const installments: Installment[] = drafts.map((draft) => ({
    id: createId(),
    planId,
    number: draft.number,
    dueDate: draft.dueDate,
    amountCents: draft.amountCents,
    txid: buildInstallmentTxid(planId, draft.number),
  }));

  return { plan, installments };
}
