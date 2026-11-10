import { describe, expect, it } from 'vitest';
import { normalizeLoginEmail } from './account-seed';
import { createDemoAppBackup } from './demo-backup';

describe('normalizeLoginEmail', () => {
  it('maps the demo alias teste to the demo email', () => {
    expect(normalizeLoginEmail('teste')).toBe('teste@teste.com');
    expect(normalizeLoginEmail('  TESTE ')).toBe('teste@teste.com');
  });
});

describe('createDemoAppBackup', () => {
  it('ships a complete fake snapshot', () => {
    const backup = createDemoAppBackup();
    expect(backup.installmentPlans).toHaveLength(15);
    expect(backup.installments.length).toBeGreaterThan(15);
    expect(backup.settings.defaultDueDay).toBe(10);
    expect(backup.settings.defaultInstallments).toBe(4);
    expect(backup.cashBoxes).toHaveLength(3);
    expect(backup.cashBoxMovements.length).toBeGreaterThanOrEqual(8);
    expect(backup.freeBalanceDeposits.length).toBeGreaterThanOrEqual(2);
    expect(backup.freeBalanceWithdrawals.length).toBeGreaterThanOrEqual(2);
    expect(backup.settings.freeBalanceCents).toBe(217_760);
    expect(backup.settings.businessName).toContain('Demo');
  });
});
