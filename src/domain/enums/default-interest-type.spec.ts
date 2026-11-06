import { describe, expect, it } from 'vitest';
import { DEFAULT_INTEREST_TYPE_VALUES, DefaultInterestType } from './default-interest-type';

describe('DefaultInterestType', () => {
  it('covers simple and compound defaults from config', () => {
    expect(DEFAULT_INTEREST_TYPE_VALUES).toEqual([
      DefaultInterestType.Simple,
      DefaultInterestType.Compound,
    ]);
  });
});
