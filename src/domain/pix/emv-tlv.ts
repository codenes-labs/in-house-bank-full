export function buildEmvTlv(id: string, value: string): string {
  if (!/^\d{2}$/.test(id)) {
    throw new Error(`Invalid EMV field id: ${id}`);
  }

  const length = value.length;
  if (length > 99) {
    throw new Error(`EMV field ${id} exceeds supported length`);
  }

  return `${id}${String(length).padStart(2, '0')}${value}`;
}
