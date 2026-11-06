export const DefaultInterestType = {
  Simple: 'SIMPLE',
  Compound: 'COMPOUND',
} as const;

export type DefaultInterestType = (typeof DefaultInterestType)[keyof typeof DefaultInterestType];

export const DEFAULT_INTEREST_TYPE_VALUES: readonly DefaultInterestType[] = [
  DefaultInterestType.Simple,
  DefaultInterestType.Compound,
];
