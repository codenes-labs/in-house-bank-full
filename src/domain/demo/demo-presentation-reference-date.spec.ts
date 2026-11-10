import { describe, expect, it } from 'vitest';
import {
  DEMO_PRESENTATION_REFERENCE_DATE,
  effectiveTodayForPresentation,
} from './demo-presentation-reference-date';
import { todayCalendarDate } from '../calendar/today-calendar-date';

describe('effectiveTodayForPresentation', () => {
  it('uses the fixed reference date on demo', () => {
    expect(effectiveTodayForPresentation(true)).toBe(DEMO_PRESENTATION_REFERENCE_DATE);
  });

  it('uses the real today otherwise', () => {
    expect(effectiveTodayForPresentation(false)).toBe(todayCalendarDate());
  });
});
