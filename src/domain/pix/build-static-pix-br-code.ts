import { buildEmvTlv } from './emv-tlv';
import { formatPixAmount } from './format-pix-amount';
import { crc16CcittFalse } from './crc16-ccitt-false';
import { normalizePixText } from './normalize-pix-text';

const PIX_GUI = 'BR.GOV.BCB.PIX';
const MERCHANT_NAME_MAX_LENGTH = 25;
const MERCHANT_CITY_MAX_LENGTH = 15;
const TXID_MAX_LENGTH = 25;
const TXID_PATTERN = /^[A-Za-z0-9]{1,25}$/;

export interface StaticPixBrCodeInput {
  pixKey: string;
  amountCents: number;
  merchantName: string;
  merchantCity: string;
  txid: string;
}

export function buildStaticPixBrCode(input: StaticPixBrCodeInput): string {
  assertValidTxid(input.txid);

  const merchantName = normalizePixText(input.merchantName, MERCHANT_NAME_MAX_LENGTH);
  const merchantCity = normalizePixText(input.merchantCity, MERCHANT_CITY_MAX_LENGTH).toUpperCase();
  const amount = formatPixAmount(input.amountCents);

  const pixKeyField = buildEmvTlv('00', PIX_GUI) + buildEmvTlv('01', input.pixKey);
  const additionalData = buildEmvTlv('05', input.txid);

  const payload = [
    buildEmvTlv('00', '01'),
    buildEmvTlv('26', pixKeyField),
    buildEmvTlv('52', '0000'),
    buildEmvTlv('53', '986'),
    buildEmvTlv('54', amount),
    buildEmvTlv('58', 'BR'),
    buildEmvTlv('59', merchantName),
    buildEmvTlv('60', merchantCity),
    buildEmvTlv('62', additionalData),
    '6304',
  ].join('');

  const crc = crc16CcittFalse(payload);
  return `${payload}${crc}`;
}

function assertValidTxid(txid: string): void {
  if (!TXID_PATTERN.test(txid) || txid.length > TXID_MAX_LENGTH) {
    throw new Error('Pix txid must be 1-25 alphanumeric characters');
  }
}
