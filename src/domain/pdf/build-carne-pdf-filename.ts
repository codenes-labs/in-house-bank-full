import type { CalendarDate } from '../models/calendar-date';

export function buildCarnePdfFilename(
  borrowerName: string,
  reference: string,
  issueDate: CalendarDate,
): string {
  const borrowerSlug = slugify(borrowerName);
  const referenceSlug = slugify(reference);
  const datePart = issueDate.replace(/-/g, '');
  return `carne-${borrowerSlug}-${referenceSlug}-${datePart}.pdf`;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}
