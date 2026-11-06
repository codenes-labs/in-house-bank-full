import { describe, expect, it } from 'vitest';
import {
  computeEstimatedFullMonthYieldCents,
  computeEstimatedMonthlyYieldCents,
  computeEstimatedMonthlyYieldNetCents,
} from './compute-estimated-monthly-yield';

describe('computeEstimatedFullMonthYieldCents', () => {
  it('projects one month of gross yield (RF-34)', () => {
    expect(computeEstimatedFullMonthYieldCents(1_000_000, 10, 100)).toBe(8_333);
  });
});

describe('computeEstimatedMonthlyYieldCents', () => {
  it('pro-rates the full-month estimate by elapsed days', () => {
    expect(computeEstimatedMonthlyYieldCents(1_000_000, 10, 100, '2026-10-16')).toBe(4_301);
  });

  it('approximates Nubank Caixa Turbo mid-month', () => {
    const grossCents = computeEstimatedMonthlyYieldCents(270_761, 12, 115, '2026-10-17');
    expect(grossCents).toBeGreaterThanOrEqual(1_700);
    expect(grossCents).toBeLessThanOrEqual(2_100);
  });

  it('projects about R$ 27 for Turbo over the full month', () => {
    const fullMonthCents = computeEstimatedFullMonthYieldCents(270_761, 12, 115);
    expect(fullMonthCents).toBeGreaterThanOrEqual(2_500);
    expect(fullMonthCents).toBeLessThanOrEqual(3_200);
  });

  it('approximates 100% CDI caixinha on a small balance mid-month', () => {
    const grossCents = computeEstimatedMonthlyYieldCents(15_000, 12, 100, '2026-10-17');
    expect(grossCents).toBeGreaterThanOrEqual(75);
    expect(grossCents).toBeLessThanOrEqual(95);
  });
});

describe('computeEstimatedMonthlyYieldNetCents', () => {
  it('applies indicative 15% IR on gross yield', () => {
    expect(computeEstimatedMonthlyYieldNetCents(1_000)).toBe(850);
  });
});
