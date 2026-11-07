import type { CashBox } from '../models/cash-box';
import type { Settings } from '../models/settings';

export function settingsAfterDeletingCashBox(settings: Settings, deletedCashBox: CashBox | undefined): Settings {
  const transferCents = deletedCashBox?.balanceCents ?? 0;
  if (transferCents === 0) {
    return settings;
  }
  return {
    ...settings,
    freeBalanceCents: settings.freeBalanceCents + transferCents,
  };
}
