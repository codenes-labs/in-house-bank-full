export type WaitlistInterestId =
  | 'organizar-renda'
  | 'caixinhas'
  | 'parcelamentos'
  | 'relatorios'
  | 'holding'
  | 'outro';

export type WaitlistInterestOption = {
  id: WaitlistInterestId;
  label: string;
};

export const WAITLIST_INTEREST_OPTIONS: readonly WaitlistInterestOption[] = [
  { id: 'organizar-renda', label: 'Organizar renda e orçamento' },
  { id: 'caixinhas', label: 'Caixinhas e patrimônio' },
  { id: 'parcelamentos', label: 'Parcelamentos e carnês' },
  { id: 'relatorios', label: 'Relatórios e backup' },
  { id: 'holding', label: 'Gestão de empresas (holding)' },
  { id: 'outro', label: 'Outro' },
] as const;

export function isWaitlistInterestId(value: string): value is WaitlistInterestId {
  return WAITLIST_INTEREST_OPTIONS.some((item) => item.id === value);
}