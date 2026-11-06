export const DASHBOARD_VALUES_VISIBILITY_STORAGE_KEY = 'in-house-bank.dashboardValuesVisible';

export const DASHBOARD_MASKED_BRL = 'R$ ••••••';
export const DASHBOARD_MASKED_COUNT = '••';
export const DASHBOARD_MASKED_PERCENT = '••%';

export function parseStoredDashboardValuesVisible(raw: string | null): boolean {
  return raw !== 'false';
}

export function serializeDashboardValuesVisible(visible: boolean): string {
  return visible ? 'true' : 'false';
}

export function formatDashboardBrl(formattedAmount: string, valuesVisible: boolean): string {
  return valuesVisible ? `R$ ${formattedAmount}` : DASHBOARD_MASKED_BRL;
}

export function formatDashboardCount(count: number, valuesVisible: boolean): string {
  return valuesVisible ? String(count) : DASHBOARD_MASKED_COUNT;
}

export function formatDashboardPercent(percent: number, valuesVisible: boolean): string {
  return valuesVisible ? `${percent}%` : DASHBOARD_MASKED_PERCENT;
}
