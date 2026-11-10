import { describe, expect, it } from 'vitest';
import { InstallmentPlanType } from '../enums/installment-plan-type';
import {
  isQuickGeneratorReadyToApplyInterest,
  isQuickGeneratorReadyToGenerate,
  simulationInstallmentCountFor,
  validateQuickGenerator,
} from './validate-quick-generator';
import type { QuickGeneratorInput } from './quick-generator-input';

const validInput: QuickGeneratorInput = {
  usedAmountCents: 54_000,
  returnAmountCents: 59_900,
  type: InstallmentPlanType.Purchase,
  reference: 'Notebook',
  borrowerName: 'Maria',
  issueDate: '2026-11-01',
  firstDueDate: '2026-11-09',
  installmentsCount: 4,
  pixKey: '390.533.447-05',
  beneficiary: 'In-House Bank',
  institution: 'Nubank',
};

describe('validateQuickGenerator', () => {
  it('accepts a complete generator input', () => {
    expect(validateQuickGenerator(validInput).valid).toBe(true);
  });

  it('requires positive amounts and valid pix key', () => {
    const result = validateQuickGenerator({
      ...validInput,
      usedAmountCents: 0,
      returnAmountCents: 0,
      pixKey: 'invalid',
    });

    expect(result.valid).toBe(false);
    expect(result.errors.usedAmountCents).toBeTruthy();
    expect(result.errors.pixKey).toBeTruthy();
  });

  it('flags expected profit warning when return is below used amount', () => {
    const result = validateQuickGenerator({
      ...validInput,
      returnAmountCents: 50_000,
    });

    expect(result.valid).toBe(true);
    expect(result.warnings.expectedProfit).toBeTruthy();
  });

  it('applies interest simulation with principal and rate', () => {
    expect(isQuickGeneratorReadyToApplyInterest(90_000, 4, 9.95)).toBe(true);
    expect(isQuickGeneratorReadyToApplyInterest(90_000, 0, 9.95)).toBe(true);
    expect(isQuickGeneratorReadyToApplyInterest(0, 4, 9.95)).toBe(false);
    expect(isQuickGeneratorReadyToApplyInterest(90_000, 4, Number.NaN)).toBe(false);
    expect(simulationInstallmentCountFor(90_000, 0, 9.95)).toBe(4);
    expect(simulationInstallmentCountFor(90_000, 12, 9.95)).toBe(12);
  });

  it('requires positive return to generate installments', () => {
    expect(isQuickGeneratorReadyToGenerate(validInput, 'SAO PAULO')).toBe(true);
    expect(isQuickGeneratorReadyToGenerate({ ...validInput, returnAmountCents: 0 }, 'SAO PAULO')).toBe(false);
  });
});
