import { describe, expect, it } from 'vitest';
import { movementTypeLabelForDisplay } from './extrato-movement-type-label';

describe('movementTypeLabelForDisplay', () => {
  it('oculta tipo redundante com a descrição', () => {
    expect(movementTypeLabelForDisplay('Entrada manual', 'Entrada manual')).toBeNull();
    expect(
      movementTypeLabelForDisplay('Resgate da caixinha Antiga poupança', 'Resgate de caixinha'),
    ).toBeNull();
  });

  it('mostra tipo quando acrescenta contexto', () => {
    expect(movementTypeLabelForDisplay('Resgate do saldo livre', 'Resgate do saldo livre')).toBeNull();
    expect(movementTypeLabelForDisplay('Crédito avulso', 'Entrada no saldo livre')).toBe('Entrada no saldo livre');
  });
});
