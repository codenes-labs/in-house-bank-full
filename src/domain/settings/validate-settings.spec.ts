import { describe, expect, it } from 'vitest';
import { DefaultInterestType } from '../enums/default-interest-type';
import { createEmptySettings } from '../models/settings';
import { validateSettings } from './validate-settings';

describe('validateSettings', () => {
  it('accepts a complete valid settings object', () => {
    const settings = {
      ...createEmptySettings(),
      businessName: 'In-House Bank',
      city: 'Sao Paulo',
      defaultPixKey: '390.533.447-05',
      defaultInstitution: 'Nubank',
      defaultInstallments: 4,
      defaultInterestType: DefaultInterestType.Simple,
      theme: 'light' as const,
      cdiAnnualPercent: 10.5,
      milestonesCents: [1_000_000],
      freeBalanceCents: 50_000,
    };

    expect(validateSettings(settings).valid).toBe(true);
  });

  it('rejects CDI annual rate that looks like the 100 index', () => {
    const result = validateSettings({
      ...createEmptySettings(),
      businessName: 'In-House Bank',
      city: 'Sao Paulo',
      defaultPixKey: '390.533.447-05',
      defaultInstitution: 'Nubank',
      cdiAnnualPercent: 100,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.cdiAnnualPercent).toBeTruthy();
  });

  it('requires city and a valid default Pix key', () => {
    const result = validateSettings({
      ...createEmptySettings(),
      businessName: 'In-House Bank',
      defaultInstitution: 'Nubank',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toMatchObject({
      city: expect.any(String),
      defaultPixKey: expect.any(String),
    });
  });

  it('validates optional document and installment ranges', () => {
    const result = validateSettings({
      ...createEmptySettings(),
      businessName: 'In-House Bank',
      city: 'Sao Paulo',
      defaultPixKey: '390.533.447-05',
      defaultInstitution: 'Nubank',
      document: '123.456.789-00',
      defaultInstallments: 0,
      defaultDueDay: 32,
    });

    expect(result.errors.document).toBeTruthy();
    expect(result.errors.defaultInstallments).toBeTruthy();
    expect(result.errors.defaultDueDay).toBeTruthy();
  });
});
