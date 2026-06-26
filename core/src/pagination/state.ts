import type { PageItem, PaginationContext, PaginationState } from "./types";

let idCounter = 0;

/** Clamp a page into the `[1, pageCount]` range. */
export const clampPage = (page: number, pageCount: number) =>
  Math.min(Math.max(page, 1), Math.max(pageCount, 1));

/** Build the initial state from user context. */
export function initialState(context: PaginationContext): PaginationState {
  const pageCount = Math.max(context.pageCount, 1);
  return {
    page: clampPage(context.page ?? 1, pageCount),
    pageCount,
    siblingCount: context.siblingCount ?? 1,
    boundaryCount: context.boundaryCount ?? 1,
    disabled: context.disabled ?? false,
    id: context.id ?? `ds-pagination-${++idCounter}`,
  };
}

const range = (start: number, end: number): number[] =>
  start > end ? [] : Array.from({ length: end - start + 1 }, (_, i) => start + i);

/**
 * Compute the rendered page items with ellipsis gaps, keeping the boundary
 * pages and a window of siblings around the current page visible. Mirrors the
 * common "1 … 4 5 6 … 20" layout.
 */
export function pageItems(state: PaginationState): PageItem[] {
  const { page, pageCount, siblingCount, boundaryCount } = state;

  // Few enough pages to show them all.
  if (pageCount <= boundaryCount * 2 + siblingCount * 2 + 3) {
    return range(1, pageCount);
  }

  const startPages = range(1, boundaryCount);
  const endPages = range(pageCount - boundaryCount + 1, pageCount);

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, pageCount - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    pageCount - boundaryCount - 1,
  );

  // The conditionals insert an ellipsis only when more than one page is hidden;
  // otherwise they place the single bridging page, so no duplicates arise.
  const items: PageItem[] = [
    ...startPages,
    siblingsStart > boundaryCount + 2 ? "ellipsis" : boundaryCount + 1,
    ...range(siblingsStart, siblingsEnd),
    siblingsEnd < pageCount - boundaryCount - 1 ? "ellipsis" : pageCount - boundaryCount,
    ...endPages,
  ];
  return items;
}
