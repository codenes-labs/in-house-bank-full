export function uuidFromRandomBytes(bytes: Uint8Array): string {
  if (bytes.length !== 16) {
    throw new Error('UUID needs 16 bytes');
  }
  const copy = Uint8Array.from(bytes);
  copy[6] = (copy[6]! & 0x0f) | 0x40;
  copy[8] = (copy[8]! & 0x3f) | 0x80;
  const hex = [...copy].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return uuidFromRandomBytes(bytes);
}
