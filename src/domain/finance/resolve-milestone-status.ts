export interface MilestoneStatus {
  currentMilestoneCents: number | null;
  nextMilestoneCents: number | null;
  remainingToNextCents: number;
  progressPercent: number;
}

export function resolveMilestoneStatus(
  patrimonyCents: number,
  milestonesCents: number[],
): MilestoneStatus {
  const sorted = [...milestonesCents]
    .filter((value) => value > 0)
    .sort((left, right) => left - right);
  if (sorted.length === 0) {
    return {
      currentMilestoneCents: null,
      nextMilestoneCents: null,
      remainingToNextCents: 0,
      progressPercent: 0,
    };
  }

  const currentMilestoneCents =
    sorted.filter((milestone) => milestone <= patrimonyCents).at(-1) ?? null;
  const nextMilestoneCents = sorted.find((milestone) => milestone > patrimonyCents) ?? null;

  if (!nextMilestoneCents) {
    return {
      currentMilestoneCents: sorted.at(-1) ?? null,
      nextMilestoneCents: null,
      remainingToNextCents: 0,
      progressPercent: 100,
    };
  }

  return {
    currentMilestoneCents,
    nextMilestoneCents,
    remainingToNextCents: nextMilestoneCents - patrimonyCents,
    progressPercent: Math.min(100, Math.round((patrimonyCents / nextMilestoneCents) * 100)),
  };
}
