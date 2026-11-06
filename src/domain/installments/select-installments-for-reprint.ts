import type { Installment } from '../models/installment';

export const ReprintSelectionMode = {
  All: 'all',
  Selected: 'selected',
} as const;

export type ReprintSelectionMode = (typeof ReprintSelectionMode)[keyof typeof ReprintSelectionMode];

export type SelectInstallmentsForReprintError = 'EMPTY_SELECTION';

export type SelectInstallmentsForReprintResult =
  | { ok: true; installments: Installment[] }
  | { ok: false; error: SelectInstallmentsForReprintError };

export function selectInstallmentsForReprint(
  planInstallments: Installment[],
  selectedInstallmentIds: ReadonlySet<string>,
  mode: ReprintSelectionMode,
): SelectInstallmentsForReprintResult {
  const sorted = [...planInstallments].sort((left, right) => left.number - right.number);

  if (mode === ReprintSelectionMode.All) {
    return { ok: true, installments: sorted };
  }

  const selected = sorted.filter((installment) => selectedInstallmentIds.has(installment.id));
  if (selected.length === 0) {
    return { ok: false, error: 'EMPTY_SELECTION' };
  }

  return { ok: true, installments: selected };
}
