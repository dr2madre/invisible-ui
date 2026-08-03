import { defineComponent, h, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";
import { usePagination } from "./use-pagination";

export interface PaginationProps {
  /** `v-model` value; takes precedence over `page` when bound. */
  modelValue?: number;
  /** Current page (1-based). */
  page?: number;
  /** Total number of pages. */
  pageCount: number;
  /** Pages shown on each side of the current page. */
  siblingCount?: number;
  /** Pages always shown at the start and end. */
  boundaryCount?: number;
  disabled?: boolean;
  /** Accessible name for the navigation landmark. Defaults to the catalog's "Pagination". */
  label?: string;
  /** Called whenever the page changes. */
  onPageChange?: (page: number) => void;
}

/**
 * Pagination: a styled pager: previous, the visible page numbers (with
 * ellipsis gaps) and next. Behaviour and accessibility (aria-current on the
 * current page, roving tabindex, arrow-key movement, disabled prev/next at
 * the bounds) come from the headless pagination (`@design-system/core`).
 *
 * The current page binds two ways: `v-model` (the idiomatic Vue form) or the
 * `page` prop plus `onPageChange`, matching the other controlled components.
 * Colors, sizing and radius are themeable via `--ds-pagination-*`.
 */
export const Pagination = defineComponent({
  name: "Pagination",
  props: {
    modelValue: { type: Number, default: undefined },
    page: { type: Number, default: 1 },
    pageCount: { type: Number, required: true },
    siblingCount: { type: Number, default: 1 },
    boundaryCount: { type: Number, default: 1 },
    disabled: { type: Boolean, default: false },
    label: { type: String, default: undefined },
    onPageChange: { type: Function as PropType<(page: number) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (page: number) => typeof page === "number",
  },
  setup(props, { emit }) {
    const { api, items, rootRef } = usePagination(() => ({
      page: props.modelValue ?? props.page,
      pageCount: props.pageCount,
      siblingCount: props.siblingCount,
      boundaryCount: props.boundaryCount,
      disabled: props.disabled,
      onPageChange: (next: number) => {
        emit("update:modelValue", next);
        props.onPageChange?.(next);
      },
    }));
    const i18n = useI18n();

    return () => {
      const { t } = i18n.value;

      return h(
        "nav",
        {
          ...api.value.rootProps,
          class: "pagination",
          ref: rootRef,
          "aria-label": props.label ?? t("pagination.label"),
        },
        [
          h(
            "button",
            {
              ...api.value.getPrevProps(),
              class: "pagination__control",
              "aria-label": "Go to previous page",
            },
            "‹",
          ),
          ...items.value.map((item, index) =>
            item === "ellipsis"
              ? h(
                  "span",
                  { key: `e${index}`, class: "pagination__ellipsis", "aria-hidden": "true" },
                  "…",
                )
              : h(
                  "button",
                  {
                    ...api.value.getPageProps(item),
                    key: `p${item}`,
                    class: "pagination__page",
                    "aria-label": `Go to page ${item}`,
                  },
                  item,
                ),
          ),
          h(
            "button",
            {
              ...api.value.getNextProps(),
              class: "pagination__control",
              "aria-label": "Go to next page",
            },
            "›",
          ),
        ],
      );
    };
  },
});
