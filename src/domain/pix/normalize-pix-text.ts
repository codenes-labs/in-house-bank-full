export function normalizePixText(value: string, maxLength: number): string {
  const withoutAccents = value.normalize('NFD').replace(/\p{M}/gu, '').trim();

  return withoutAccents.slice(0, maxLength);
}
