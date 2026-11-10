import { describe, expect, it } from 'vitest';
import { maskMilestoneReaisInput, parseMilestoneReaisToCents, sortMilestonesCents } from './parse-milestone-reais';

describe('maskMilestoneReaisInput', () => {
  it('keeps digits and formats thousands', () => {
    expect(maskMilestoneReaisInput('5000abc')).toBe('5.000');
    expect(maskMilestoneReaisInput('')).toBe('');
  });
});

describe('parseMilestoneReaisToCents', () => {
  it('converts formatted reais to cents', () => {
    expect(parseMilestoneReaisToCents('5.000')).toBe(500_000);
    expect(parseMilestoneReaisToCents('')).toBeNull();
    expect(parseMilestoneReaisToCents('abc')).toBeNull();
  });
});

describe('sortMilestonesCents', () => {
  it('sorts ascending and drops non-positive', () => {
    expect(sortMilestonesCents([500_000, 100_000, -1, 0])).toEqual([100_000, 500_000]);
  });
});
