import { pagination as core, type ElementProps } from "@design-system/core";
import { useCallback, useId, useMemo, useRef } from "react";
import { useControllable } from "../internal/controllable";
import { useIsomorphicLayoutEffect } from "../internal/layout-effect";
import { focusValue, keyedByDirection, type Direction } from "../internal/roving";
import { normalizeProps } from "../normalize";

export type PageItem = core.PageItem;

export interface UsePaginationOptions {
  /** Initial (uncontrolled) or current (controlled) page, 1-based; clamped to `pageCount`. */
  page?: number;
  /** Total number of pages. */
  pageCount: number;
  /** Pages shown on each side of the current page. Defaults to `1`. */
  siblingCount?: number;
  /** Pages always shown at the start and end. Defaults to `1`. */
  boundaryCount?: number;
  disabled?: boolean;
  /** Called whenever the user changes the page. */
  onPageChange?: (page: number) => void;
}

/** The controls of one pager live inside the element that carries its id. */
const focusIn = (id: string, value: string) => focusValue(document.getElementById(id), value);

/**
 * Connect the headless pagination to React: previous, the visible page
 * numbers (with ellipsis gaps) and next form one roving collection, with the
 * current page marked `aria-current="page"`. In right-to-left text the left
 * and right arrows follow the visual order.
 *
 * `page` is a controllable mirror (ADR 0011), clamped to the current page
 * count: a later prop, or a shrinking count, moves it without a report. When
 * a press disables Previous or Next, focus moves to the page that is now
 * current. Spread `rootProps` on the
 * container: it carries the id the arrow keys look for the controls under.
 */
export function usePagination({
  page: pageProp = 1,
  pageCount,
  siblingCount = 1,
  boundaryCount = 1,
  disabled = false,
  onPageChange,
}: UsePaginationOptions): core.PaginationApi {
  const id = `ds-pagination-${useId()}`;
  // The page that takes focus once the press that disabled Previous or Next
  // has rendered.
  const pendingFocus = useRef<string | null>(null);
  const [own, setOwn] = useControllable(pageProp, undefined);
  const count = Math.max(pageCount, 1);
  const page = core.clampPage(own, count);

  const connect = useCallback(
    (direction: Direction) =>
      core.connect({
        state: { page, pageCount: count, siblingCount, boundaryCount, disabled, id },
        setPage: (next) => {
          setOwn(next);
          onPageChange?.(next);
        },
        focus: (target) => focusIn(id, target),
        direction,
        normalize: normalizeProps,
      }),
    [page, count, siblingCount, boundaryCount, disabled, id, setOwn, onPageChange],
  );

  const api = useMemo(() => {
    const ltr = connect("ltr");
    const stepping = (props: ElementProps, target: number): ElementProps => ({
      ...props,
      onClick: () => {
        (props.onClick as () => void)();
        if (target <= 1 || target >= count) pendingFocus.current = String(target);
      },
    });
    return {
      ...ltr,
      rootProps: { ...ltr.rootProps, id },
      getPrevProps: () =>
        keyedByDirection(stepping(ltr.getPrevProps(), page - 1), () =>
          connect("rtl").getPrevProps(),
        ),
      getNextProps: () =>
        keyedByDirection(stepping(ltr.getNextProps(), page + 1), () =>
          connect("rtl").getNextProps(),
        ),
      getPageProps: (p: number) =>
        keyedByDirection(ltr.getPageProps(p), () => connect("rtl").getPageProps(p)),
    };
  }, [connect, page, count, id]);

  useIsomorphicLayoutEffect(() => {
    if (pendingFocus.current === null) return;
    focusIn(id, pendingFocus.current);
    pendingFocus.current = null;
  });

  return api;
}
