export const DEFAULT_MILESTONES_CENTS = [
  1_000_000,
  2_000_000,
  5_000_000,
  10_000_000,
  20_000_000,
  50_000_000,
  100_000_000,
] as const;

export function milestonesOrDefault(milestonesCents: number[]): number[] {
  return milestonesCents.length > 0 ? milestonesCents : [...DEFAULT_MILESTONES_CENTS];
}
