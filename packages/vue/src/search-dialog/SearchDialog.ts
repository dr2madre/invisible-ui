import {
  defineComponent,
  h,
  type ComponentPublicInstance,
  type PropType,
  type VNodeChild,
} from "vue";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import { Kbd } from "../kbd/Kbd";
import { Loading } from "../loading/Loading";
import { useSearchDialog, type SearchDialogItem } from "./use-search-dialog";

export interface SearchDialogProps {
  /** Visual variant for the trigger Button. */
  triggerVariant?: ButtonVariant;
  /** The trigger button's label. The `trigger` slot replaces it with markup. */
  trigger?: string;
  items: SearchDialogItem[];
  /**
   * Items shown while the query is empty: recents, frequent searches. The
   * application measures and decides; the dialog displays. They may carry their
   * own `group` ("Recent"). Empty means an empty query shows all items.
   */
  suggestions?: SearchDialogItem[];
  /**
   * Results are being fetched: shows an indicator, announces "Searching…"
   * through the status region and holds back the empty state meanwhile. Feed
   * async results through `items` when they arrive.
   */
  loading?: boolean;
  /** Initial / controlled open state; bindable with `v-model:open`. */
  open?: boolean;
  /** Accessible title for the dialog. Defaults to the catalog's "Search". */
  title?: string;
  /** Accessible label for the search input. Defaults to the catalog's "Search". */
  label?: string;
  /** Input placeholder. Defaults to the catalog's "Type to search…". */
  placeholder?: string;
  /** Text shown when nothing matches. Defaults to the catalog's "No results found.". */
  emptyText?: string;
  onSelect?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
}

/** A run of consecutive results sharing a group (or the ungrouped run). */
interface Section {
  group: string | null;
  items: SearchDialogItem[];
}

/**
 * SearchDialog — search and pick from a list, in a modal (the pattern often
 * marketed as "command palette"): a search combobox inside a modal dialog.
 * Ported from the Svelte adapter. The modal shell (native `<dialog>` plus
 * `showModal()`, scroll lock, Escape and backdrop close, focus restore) and the
 * search/filter/keyboard behaviour come from the headless dialog and combobox
 * (`@design-system/core`); this is the styled wrapper. A visually-hidden
 * `role="status"` region announces the filtered result count to screen readers.
 *
 * Pass `items` (`{ value, label?, disabled? }`); `onSelect(value)` runs when a
 * result is chosen. The `trigger` prop/slot is the opener button. The open state
 * binds two ways: `v-model:open` or the `open` prop plus `onOpenChange`; wire
 * any keyboard shortcut in the application. Themeable via
 * `--ds-search-dialog-*`.
 */
export const SearchDialog = defineComponent({
  name: "SearchDialog",
  props: {
    triggerVariant: { type: String as PropType<ButtonVariant>, default: "default" },
    trigger: { type: String, default: undefined },
    items: { type: Array as PropType<SearchDialogItem[]>, required: true },
    suggestions: { type: Array as PropType<SearchDialogItem[]>, default: () => [] },
    loading: { type: Boolean, default: false },
    open: { type: Boolean, default: false },
    title: { type: String, default: undefined },
    label: { type: String, default: undefined },
    placeholder: { type: String, default: undefined },
    emptyText: { type: String, default: undefined },
    onSelect: { type: Function as PropType<(value: string) => void>, default: undefined },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
  },
  emits: {
    "update:open": (open: boolean) => typeof open === "boolean",
  },
  setup(props, { emit, slots }) {
    const i18n = useI18n();

    const { api, dialogApi, open, items, inputValue, onInputChange, triggerRef, panelRef } =
      useSearchDialog(() => ({
        items: props.items,
        suggestions: props.suggestions,
        open: props.open,
        onSelect: props.onSelect,
        onOpenChange: (next: boolean) => {
          emit("update:open", next);
          props.onOpenChange?.(next);
        },
      }));

    // A template ref on a component yields its instance; the composable wants
    // the DOM node it renders, to restore focus to it on close.
    const setTriggerRef = (el: Element | ComponentPublicInstance | null) => {
      const node = el && "$el" in el ? (el.$el as Element) : el;
      triggerRef.value = node instanceof HTMLElement ? node : null;
    };

    /** One result row: its label plus an optional keycap shortcut. */
    const optionNode = (item: SearchDialogItem): VNodeChild =>
      h(
        "div",
        { ...api.value.getOptionProps(item.value), key: item.value, class: "search-dialog__item" },
        [
          h("span", { class: "search-dialog__item-label" }, item.label ?? item.value),
          item.shortcut
            ? h("span", { class: "search-dialog__item-shortcut" }, [
                Array.isArray(item.shortcut)
                  ? h(Kbd, { keys: item.shortcut })
                  : h(Kbd, null, { default: () => item.shortcut }),
              ])
            : null,
        ],
      );

    return () => {
      const { t } = i18n.value;
      const resolvedTitle = props.title ?? t("searchDialog.title");
      const resolvedLabel = props.label ?? t("searchDialog.label");
      const resolvedPlaceholder = props.placeholder ?? t("searchDialog.placeholder");
      const resolvedEmptyText = props.emptyText ?? t("searchDialog.empty");

      const triggerNode = h(
        Button,
        { variant: props.triggerVariant, ...dialogApi.value.triggerProps, ref: setTriggerRef },
        { default: () => slots.trigger?.() ?? props.trigger ?? "Search…" },
      );

      if (!open.value) return [triggerNode, null];

      // The composable puts items in display order (ungrouped first, then one
      // run per group), so consecutive runs of the same group form the sections.
      const sections = items.value.reduce<Section[]>((acc, item) => {
        const group = item.group ?? null;
        const last = acc[acc.length - 1];
        if (last && last.group === group) last.items.push(item);
        else acc.push({ group, items: [item] });
        return acc;
      }, []);

      const count = items.value.length;
      const announcement = props.loading
        ? t("searchDialog.loading")
        : count === 0
          ? resolvedEmptyText
          : count === 1
            ? t("searchDialog.resultOne")
            : t("searchDialog.resultMany", { count });

      const panel = h(
        "dialog",
        { ...dialogApi.value.contentProps, ref: panelRef, class: "search-dialog__panel" },
        [
          h(
            "h2",
            { ...dialogApi.value.titleProps, class: "search-dialog__sr-only" },
            resolvedTitle,
          ),

          h("div", { class: "search-dialog__search" }, [
            h("span", { class: "search-dialog__search-icon", "aria-hidden": "true" }, [
              h(
                Icon,
                { size: "100%" },
                {
                  default: () => [
                    h("circle", { cx: "11", cy: "11", r: "8" }),
                    h("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" }),
                  ],
                },
              ),
            ]),
            h("label", { ...api.value.labelProps, class: "search-dialog__sr-only" }, resolvedLabel),
            h("input", {
              ...api.value.inputProps,
              class: "search-dialog__input",
              type: "text",
              placeholder: resolvedPlaceholder,
              value: inputValue.value,
              onInput: onInputChange,
            }),
          ]),

          // Polite announcement of the filtered results for screen readers.
          h("div", { class: "search-dialog__sr-only", role: "status" }, announcement),

          props.loading
            ? h("div", { class: "search-dialog__loading" }, [
                h(Loading, { variant: "dots", decorative: true }),
              ])
            : null,

          // The listbox stays in the DOM even when empty so the input's
          // aria-controls keeps pointing at a real element. Divs with explicit
          // roles: ARIA in HTML disallows role="group" on <li>, and the
          // listbox/option roles carry the list semantics.
          h(
            "div",
            { ...api.value.listboxProps, class: "search-dialog__list" },
            // Ungrouped runs are spread flat so the listbox owns its options
            // directly; only a named section adds a wrapper.
            sections.flatMap((section) =>
              section.group
                ? // The visible header is hidden from assistive tech; the
                  // group's aria-label carries the same name, announced once.
                  h(
                    "div",
                    {
                      key: section.group,
                      class: "search-dialog__group",
                      role: "group",
                      "aria-label": section.group,
                    },
                    [
                      h(
                        "span",
                        { class: "search-dialog__group-header", "aria-hidden": "true" },
                        section.group,
                      ),
                      ...section.items.map(optionNode),
                    ],
                  )
                : section.items.map(optionNode),
            ),
          ),

          count === 0 && !props.loading
            ? h("p", { class: "search-dialog__empty" }, resolvedEmptyText)
            : null,
        ],
      );

      return [triggerNode, panel];
    };
  },
});
