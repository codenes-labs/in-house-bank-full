const CHARSET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Senha legível para repasse ao cliente (sem caracteres ambíguos 0/O/1/l). */
export function generateProvisionalPassword(length = 12): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CHARSET[bytes[i]! % CHARSET.length];
  }
  return out;
}