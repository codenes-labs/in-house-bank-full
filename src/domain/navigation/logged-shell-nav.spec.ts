import { describe, expect, it } from 'vitest';
import { ExtratoKind } from '../ledger/extrato-kind';
import {
  isRelatoriosExtratoNavActive,
  relatoriosExtratoNavTo,
  relatoriosExtratoNavKind,
} from './logged-shell-nav';

describe('logged-shell-nav', () => {
  it('builds extrato routes from kind', () => {
    expect(relatoriosExtratoNavTo(ExtratoKind.Installments)).toBe('/relatorios/extrato');
    expect(relatoriosExtratoNavTo(ExtratoKind.Payables)).toBe('/relatorios/extrato?tipo=PAYABLES');
  });

  it('marks active sidebar item from pathname and search', () => {
    expect(
      isRelatoriosExtratoNavActive('/relatorios/extrato', '', '/relatorios/extrato'),
    ).toBe(true);
    expect(
      isRelatoriosExtratoNavActive('/relatorios/extrato', '?tipo=CASH_BOX', '/relatorios/extrato?tipo=CASH_BOX'),
    ).toBe(true);
    expect(
      isRelatoriosExtratoNavActive('/relatorios/extrato', '?tipo=PAYABLES', '/relatorios/extrato'),
    ).toBe(false);
    expect(relatoriosExtratoNavKind('/relatorios/extrato?tipo=FREE_BALANCE')).toBe(ExtratoKind.FreeBalance);
  });
});
