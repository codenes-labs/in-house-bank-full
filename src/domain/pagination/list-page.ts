export const INSTALLMENT_PLAN_LIST_PAGE_SIZE = 10;

export function totalPages(itemCount: number, pageSize: number): number {
  if (itemCount <= 0) {
    return 1;
  }
  return Math.ceil(itemCount / pageSize);
}

export function clampPage(page: number, itemCount: number, pageSize: number): number {
  const last = totalPages(itemCount, pageSize);
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }
  return Math.min(Math.floor(page), last);
}

export function sliceListPage<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const safePage = clampPage(page, items.length, pageSize);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function needsListPagination(itemCount: number, pageSize: number): boolean {
  return itemCount > pageSize;
}
