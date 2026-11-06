import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_MASKED_BRL,
  DASHBOARD_MASKED_COUNT,
  DASHBOARD_MASKED_PERCENT,
  formatDashboardBrl,
  formatDashboardCount,
  formatDashboardPercent,
  parseStoredDashboardValuesVisible,
  serializeDashboardValuesVisible,
} from './dashboard-values-visibility';

describe('parseStoredDashboardValuesVisible', () => {
  it('defaults to visible when storage is missing or invalid', () => {
    expect(parseStoredDashboardValuesVisible(null)).toBe(true);
    expect(parseStoredDashboardValuesVisible('')).toBe(true);
    expect(parseStoredDashboardValuesVisible('yes')).toBe(true);
  });

  it('reads false when explicitly stored', () => {
    expect(parseStoredDashboardValuesVisible('false')).toBe(false);
  });
});

describe('serializeDashboardValuesVisible', () => {
  it('round-trips with parse', () => {
    expect(parseStoredDashboardValuesVisible(serializeDashboardValuesVisible(true))).toBe(true);
    expect(parseStoredDashboardValuesVisible(serializeDashboardValuesVisible(false))).toBe(false);
  });
});

describe('dashboard value masking', () => {
  it('masks BRL, counts and percent when values are hidden', () => {
    expect(formatDashboardBrl('599,00', false)).toBe(DASHBOARD_MASKED_BRL);
    expect(formatDashboardCount(4, false)).toBe(DASHBOARD_MASKED_COUNT);
    expect(formatDashboardPercent(66, false)).toBe(DASHBOARD_MASKED_PERCENT);
  });

  it('shows formatted values when visible', () => {
    expect(formatDashboardBrl('599,00', true)).toBe('R$ 599,00');
    expect(formatDashboardCount(4, true)).toBe('4');
    expect(formatDashboardPercent(66, true)).toBe('66%');
  });
});
