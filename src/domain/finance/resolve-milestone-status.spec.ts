import { describe, expect, it } from 'vitest';
import { resolveMilestoneStatus } from './resolve-milestone-status';

describe('resolveMilestoneStatus', () => {
  it('returns current, next milestone and remaining amount (RF-31)', () => {
    const status = resolveMilestoneStatus(25_000, [10_000, 50_000, 100_000]);
    expect(status.currentMilestoneCents).toBe(10_000);
    expect(status.nextMilestoneCents).toBe(50_000);
    expect(status.remainingToNextCents).toBe(25_000);
    expect(status.progressPercent).toBe(50);
  });
});
