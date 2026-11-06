export function buildInstallmentTxid(planId: string, installmentNumber: number): string {
  const compactPlanId = planId.replace(/-/g, '').slice(0, 12);
  const suffix = String(installmentNumber).padStart(2, '0');
  return `${compactPlanId}${suffix}`.slice(0, 25);
}
