const CRC16_POLYNOMIAL = 0x1021;
const CRC16_INITIAL = 0xffff;

export function crc16CcittFalse(payload: string): string {
  let crc = CRC16_INITIAL;

  for (let index = 0; index < payload.length; index++) {
    crc ^= payload.charCodeAt(index) << 8;

    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ CRC16_POLYNOMIAL;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}
