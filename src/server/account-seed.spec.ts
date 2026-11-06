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
    expect(backup.installmentPlans).toHaveLength(1);
    expect(backup.installments).toHaveLength(2);
    expect(backup.cashBoxes).toHaveLength(1);
    expect(backup.settings.businessName).toContain('Demo');
  });
});
