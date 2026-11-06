import { describe, expect, it } from 'vitest';
import { PROTOTYPE_PAYLOAD_FOR_CRC } from './br-code-reference.fixture';
import { crc16CcittFalse } from './crc16-ccitt-false';

describe('crc16CcittFalse (RN-08)', () => {
  it('matches the prototype payload CRC', () => {
    expect(crc16CcittFalse(PROTOTYPE_PAYLOAD_FOR_CRC)).toBe('FC79');
  });

  it('returns 29B1 for 123456789', () => {
    expect(crc16CcittFalse('123456789')).toBe('29B1');
  });
});
