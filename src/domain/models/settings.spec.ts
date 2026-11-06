import { describe, expect, it } from 'vitest';
import { DefaultInterestType } from '../enums/default-interest-type';
import { createEmptySettings } from './settings';

describe('createEmptySettings', () => {
  it('provides required fields with safe defaults', () => {
    const settings = createEmptySettings();

    expect(settings).toMatchObject({
      businessName: '',
      city: '',
      defaultPixKey: '',
      defaultInstitution: '',
      defaultInstallments: 1,
      defaultInterestType: DefaultInterestType.Simple,
      theme: 'light',
      cdiAnnualPercent: 0,
      milestonesCents: [],
      freeBalanceCents: 0,
    });
    expect(settings.document).toBeUndefined();
    expect(settings.defaultDueDay).toBeUndefined();
    expect(settings.pdfFooterText).toBeUndefined();
  });
});
