import { describe, expect, it } from 'vitest';
import { syncHoldingRevealPassword } from './sync-holding-reveal-password';

describe('syncHoldingRevealPassword', () => {
  it('stores new password for company accounts', () => {
    expect(syncHoldingRevealPassword('standard', 'clienteNova')).toBe('clienteNova');
  });

  it('stores for demo', () => {
    expect(syncHoldingRevealPassword('demo', 'demoNova')).toBe('demoNova');
  });
});