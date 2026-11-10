/** Exibe tipo secundário só quando acrescenta informação além da descrição principal. */
export function movementTypeLabelForDisplay(
  description: string,
  movementType: string | null | undefined,
): string | null {
  if (!movementType) {
    return null;
  }
  const primary = description.trim();
  const type = movementType.trim();
  if (!type) {
    return null;
  }
  if (primary.toLowerCase() === type.toLowerCase()) {
    return null;
  }
  if (primary.toLowerCase().includes(type.toLowerCase())) {
    return null;
  }
  if (/caixinha/i.test(primary) && /caixinha/i.test(type)) {
    return null;
  }
  if (/entrada manual/i.test(primary) && /entrada/i.test(type)) {
    return null;
  }
  return type;
}
