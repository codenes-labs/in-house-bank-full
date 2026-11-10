export function formatIssuedAtBr(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()} às ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}
