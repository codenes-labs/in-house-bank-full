import { describe, expect, it } from 'vitest';
import {
  PROTOTYPE_PIX_INPUT,
  PROTOTYPE_STATIC_PIX_BR_CODE,
} from './br-code-reference.fixture';
import { buildStaticPixBrCode } from './build-static-pix-br-code';
import { crc16CcittFalse } from './crc16-ccitt-false';

describe('buildStaticPixBrCode (RN-08)', () => {
  it('reproduces the prototype copy-and-paste code', () => {
    expect(buildStaticPixBrCode(PROTOTYPE_PIX_INPUT)).toBe(PROTOTYPE_STATIC_PIX_BR_CODE);
  });

  it('appends a valid CRC16 for generated payloads', () => {
    const code = buildStaticPixBrCode({
      pixKey: 'email@example.com',
      amountCents: 10_000,
      merchantName: 'Loja Teste',
      merchantCity: 'Curitiba',
      txid: 'abc123',
    });

    const payloadForCrc = code.slice(0, -4);
    const crc = code.slice(-4);
    expect(crc16CcittFalse(payloadForCrc)).toBe(crc);
  });

  it('rejects invalid txid characters', () => {
    expect(() =>
      buildStaticPixBrCode({
        ...PROTOTYPE_PIX_INPUT,
        txid: 'inválido!',
      }),
    ).toThrow();
  });
});
