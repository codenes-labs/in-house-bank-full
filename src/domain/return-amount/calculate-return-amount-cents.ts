import { ReturnRateMode, type ReturnRateMode as ReturnRateModeValue } from './return-rate-mode';

export interface CalculateReturnAmountInput {
  principalCents: number;
  installmentCount: number;
  mode: ReturnRateModeValue;
  ratePercent: number;
}

export function calculateReturnAmountCents(input: CalculateReturnAmountInput): number {
  assertPositivePrincipal(input.principalCents);
  assertPositiveInstallmentCount(input.installmentCount);

  switch (input.mode) {
    case ReturnRateMode.TotalPercent:
      return roundCents(input.principalCents * (1 + input.ratePercent / 100));
    case ReturnRateMode.MonthlySimple:
      return roundCents(
        input.principalCents * (1 + (input.ratePercent / 100) * input.installmentCount),
      );
    case ReturnRateMode.MonthlyCompound:
      return (
        calculatePriceInstallmentCents(
          input.principalCents,
          input.ratePercent,
          input.installmentCount,
        ) * input.installmentCount
      );
    default:
      throw new Error(`Unsupported return rate mode: ${input.mode}`);
  }
}

export function calculatePriceInstallmentCents(
  principalCents: number,
  monthlyRatePercent: number,
  installmentCount: number,
): number {
  assertPositivePrincipal(principalCents);
  assertPositiveInstallmentCount(installmentCount);

  const monthlyRate = monthlyRatePercent / 100;
  if (monthlyRate === 0) {
    return roundCents(principalCents / installmentCount);
  }

  const discountFactor = 1 - Math.pow(1 + monthlyRate, -installmentCount);
  const payment = (principalCents * monthlyRate) / discountFactor;
  return roundCents(payment);
}

function roundCents(value: number): number {
  return Math.round(value);
}

function assertPositivePrincipal(principalCents: number): void {
  if (!Number.isFinite(principalCents) || principalCents <= 0) {
    throw new Error('Principal must be a positive amount in cents');
  }
}

function assertPositiveInstallmentCount(installmentCount: number): void {
  if (!Number.isInteger(installmentCount) || installmentCount < 1) {
    throw new Error('Installment count must be a positive integer');
  }
}
