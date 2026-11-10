import { describe, expect, it } from 'vitest';
import {
  clampPage,
  INSTALLMENT_PLAN_LIST_PAGE_SIZE,
  needsListPagination,
  sliceListPage,
  totalPages,
} from './list-page';

describe('list-page', () => {
  const items = Array.from({ length: 25 }, (_, index) => index + 1);

  it('does not paginate ten or fewer items', () => {
    expect(needsListPagination(10, INSTALLMENT_PLAN_LIST_PAGE_SIZE)).toBe(false);
    expect(needsListPagination(11, INSTALLMENT_PLAN_LIST_PAGE_SIZE)).toBe(true);
  });

  it('slices pages of ten', () => {
    expect(sliceListPage(items, 1, 10)).toEqual(items.slice(0, 10));
    expect(sliceListPage(items, 3, 10)).toEqual(items.slice(20, 25));
  });

  it('clamps page when filters shrink the list', () => {
    expect(clampPage(3, 5, 10)).toBe(1);
    expect(totalPages(25, 10)).toBe(3);
  });
});
