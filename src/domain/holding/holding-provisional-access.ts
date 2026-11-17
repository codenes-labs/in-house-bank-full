export const DEFAULT_HOLDING_PROVISIONAL_HOURS = 72;

export type HoldingProvisionalAccessView = {
  active: boolean;
  reveal: string | null;
  expiresAt: string | null;
};

export function holdingProvisionalIsActive(validUntilIso: string | null | undefined, nowMs: number): boolean {
  if (!validUntilIso) {
    return false;
  }
  const until = Date.parse(validUntilIso);
  return Number.isFinite(until) && until > nowMs;
}

export function resolveHoldingProvisionalAccess(
  reveal: string | null | undefined,
  validUntil: Date | string | null | undefined,
  nowMs: number = Date.now(),
): HoldingProvisionalAccessView {
  const expiresAt =
    validUntil instanceof Date
      ? validUntil.toISOString()
      : validUntil
        ? String(validUntil)
        : null;
  const active = holdingProvisionalIsActive(expiresAt, nowMs);
  return {
    active,
    reveal: active ? reveal?.trim() || null : null,
    expiresAt: active ? expiresAt : null,
  };
}

export function clampProvisionalHours(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    return DEFAULT_HOLDING_PROVISIONAL_HOURS;
  }
  return Math.min(Math.floor(n), 24 * 14);
}

export function provisionalValidUntilFromHours(hours: number, nowMs: number = Date.now()): Date {
  return new Date(nowMs + hours * 60 * 60 * 1000);
}