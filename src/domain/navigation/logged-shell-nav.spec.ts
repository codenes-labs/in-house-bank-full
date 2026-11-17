import { describe, expect, it } from 'vitest';
import { ExtratoKind } from '../ledger/extrato-kind';
import { HOLDING_ADMIN_EMAIL } from '../holding/holding-admin';
import {
  desktopNavGroupsForUser,
  isRelatoriosExtratoNavActive,
  relatoriosExtratoNavTo,
  relatoriosExtratoNavKind,
} from './logged-shell-nav';

describe('logged-shell-nav', () => {
  it('builds extrato routes from kind', () => {
    expect(relatoriosExtratoNavTo(ExtratoKind.Installments)).toBe('/relatorios/extrato');
    expect(relatoriosExtratoNavTo(ExtratoKind.Payables)).toBe('/relatorios/extrato?tipo=PAYABLES');
  });

  it('adds Holding group only for admin email', () => {
    const standard = desktopNavGroupsForUser({ email: 'outro@exemplo.com', isDemo: false });
    expect(standard.some((group) => group.title === 'Holding')).toBe(false);
    const empresa = desktopNavGroupsForUser({ email: 'empresa@c1.com', isDemo: false });
    expect(empresa.some((group) => group.title === 'Holding')).toBe(false);
    const admin = desktopNavGroupsForUser({ email: HOLDING_ADMIN_EMAIL, isDemo: false });
    const holding = admin.find((group) => group.title === 'Holding');
    expect(holding?.items[0]?.to).toBe('/holding/empresas');
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
