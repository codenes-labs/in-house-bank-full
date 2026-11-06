import {
  calculatePriceInstallmentCents,
  calculateReturnAmountCents,
} from './calculate-return-amount-cents';
import { ReturnRateMode } from './return-rate-mode';

export interface ReturnAmountSimulation {
  simpleReturnAmountCents: number;
  compoundReturnAmountCents: number;
  compoundInstallmentAmountCents: number;
}

export function simulateReturnAmounts(
  principalCents: number,
  monthlyRatePercent: number,
  installmentCount: number,
): ReturnAmountSimulation {
  const compoundInstallmentAmountCents = calculatePriceInstallmentCents(
    principalCents,
    monthlyRatePercent,
    installmentCount,
  );

  return {
    simpleReturnAmountCents: calculateReturnAmountCents({
      principalCents,
      installmentCount,
      mode: ReturnRateMode.MonthlySimple,
      ratePercent: monthlyRatePercent,
    }),
    compoundReturnAmountCents: calculateReturnAmountCents({
      principalCents,
      installmentCount,
      mode: ReturnRateMode.MonthlyCompound,
      ratePercent: monthlyRatePercent,
    }),
    compoundInstallmentAmountCents,
  };
}
