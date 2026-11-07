import type { Installment } from '../models/installment';
import type { Settings } from '../models/settings';

export function settingsAfterInstallmentChange(
  settings: Settings,
  previous: Installment,
  next: Installment,
): Settings {
  let freeBalanceCents = settings.freeBalanceCents;
  const wasPaid = previous.paidDate !== undefined;
  const isPaid = next.paidDate !== undefined;

  if (!wasPaid && isPaid) {
    freeBalanceCents += next.amountCents;
  } else if (wasPaid && !isPaid) {
    freeBalanceCents -= previous.amountCents;
  } else if (wasPaid && isPaid && previous.amountCents !== next.amountCents) {
    freeBalanceCents += next.amountCents - previous.amountCents;
  }

  return { ...settings, freeBalanceCents };
}
