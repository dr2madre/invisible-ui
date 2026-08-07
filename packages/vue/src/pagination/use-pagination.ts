import { pagination as core } from "@design-system/core";
import {
  computed,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export type PageItem = core.PageItem;

export interface UsePaginationOptions {
  /** Current page (1-based). Defaults to `1`. */
  page?: number;
  /** Total number of pages. */
  pageCount: number;
  /** Pages shown on each side of the current page. Defaults to `1`. */
  siblingCount?: number;
  /** Pages always shown at the start and end. Defaults to `1`. */
  boundaryCount?: number;
  /** Whether the whole control is disabled. */
  disabled?: boolean;
  /** Called whenever the page changes. */
  onPageChange?: (page: number) => void;
}

export interface UsePagination {
  /** Reactive connected API; spread `rootProps` / `getPrevProps` / `getNextProps` / `getPageProps`. */
  api: ComputedRef<core.PaginationApi>;
  /** Current page (1-based). */
  page: ComputedRef<number>;
  /** Rendered items (page numbers and ellipsis gaps). */
  items: ComputedRef<PageItem[]>;
  /** Template ref for the container; scopes focus movement during arrow navigation. */
  rootRef: Ref<HTMLElement | null>;
}

// Stable per-instance ids, as in Select: a module counter keeps the Vue peer
// range at ^3.4 (Vue's own `useId` landed in 3.5).
/**
 * Connect the headless pagination to Vue: previous, the visible page numbers
 * (with ellipsis gaps) and next form a single-select roving collection, like
 * Tabs. Behaviour and accessibility (aria-current on the current page,
 * disabled prev/next at the bounds, arrow-key movement) live in
 * `@design-system/core`; this composable owns the resolved state, derives the
 * connected props with `computed(connect)`, and moves DOM focus inside the
 * container (`rootRef`).
 */
export function usePagination(options: MaybeRefOrGetter<UsePaginationOptions>): UsePagination {
  const id = useStableId("ds-pagination");
  const resolved = computed(() => toValue(options));

  const pageCount = computed(() => Math.max(resolved.value.pageCount, 1));
  const page = ref(core.clampPage(resolved.value.page ?? 1, pageCount.value));

  // Mirror an externally controlled page.
  watch(
    () => resolved.value.page,
    (next) => {
      if (next != null) page.value = core.clampPage(next, pageCount.value);
    },
  );

  const setPage = (next: number) => {
    if (page.value === next) return;
    page.value = next;
    resolved.value.onPageChange?.(next);
  };

  const rootRef = ref<HTMLElement | null>(null);
  const focus = (target: string) => {
    const el = rootRef.value
      ? Array.from(rootRef.value.querySelectorAll<HTMLElement>("[data-value]")).find(
          (node) => node.dataset.value === target,
        )
      : null;
    el?.focus();
  };

  const api = computed(() =>
    core.connect({
      state: {
        page: page.value,
        pageCount: pageCount.value,
        siblingCount: resolved.value.siblingCount ?? 1,
        boundaryCount: resolved.value.boundaryCount ?? 1,
        disabled: resolved.value.disabled ?? false,
        id,
      },
      setPage,
      focus,
      normalize: normalizeProps,
    }),
  );

  return {
    api,
    page: computed(() => page.value),
    items: computed(() => api.value.items),
    rootRef,
  };
}
