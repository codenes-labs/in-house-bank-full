import { describe, expect, it } from 'vitest';
import { buildCalendarMonthGrid } from './build-calendar-month-grid';

describe('buildCalendarMonthGrid', () => {
  it('starts on sunday column and includes 42 cells', () => {
    const grid = buildCalendarMonthGrid(2026, 12);
    expect(grid).toHaveLength(42);
    expect(grid.some((cell) => cell.date === '2026-12-01' && cell.inCurrentMonth)).toBe(true);
    expect(grid.some((cell) => cell.date.startsWith('2026-11-') && !cell.inCurrentMonth)).toBe(true);
  });
});
