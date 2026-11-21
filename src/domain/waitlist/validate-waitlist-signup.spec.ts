import { describe, expect, it } from 'vitest';
import { validateWaitlistSignup } from './validate-waitlist-signup';

describe('validateWaitlistSignup', () => {
  it('aceita cadastro completo com consentimento', () => {
    const result = validateWaitlistSignup({
      name: 'Maria Silva',
      email: 'maria@exemplo.com',
      interest: 'organizar-renda',
      message: 'Quero dividir o salário.',
      consentGiven: true,
      source: 'lista-espera',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe('maria@exemplo.com');
      expect(result.value.consentGiven).toBe(true);
    }
  });

  it('rejeita sem consentimento', () => {
    const result = validateWaitlistSignup({
      name: 'Maria',
      email: 'maria@exemplo.com',
      interest: 'caixinhas',
      consentGiven: false,
    });
    expect(result).toEqual({
      ok: false,
      error: 'Marque que autoriza o contato sobre o In House Bank.',
    });
  });

  it('rejeita interesse inválido', () => {
    const result = validateWaitlistSignup({
      name: 'Maria',
      email: 'maria@exemplo.com',
      interest: 'invalido',
      consentGiven: true,
    });
    expect(result.ok).toBe(false);
  });
});