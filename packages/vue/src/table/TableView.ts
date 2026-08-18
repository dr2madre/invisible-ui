import { computed, defineComponent, h, onScopeDispose, ref, watch, type PropType } from "vue";
import { Card } from "../card/Card";
import { Checkbox } from "../checkbox/Checkbox";
import { Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import { Pagination } from "../pagination/Pagination";
import { Popover } from "../popover/Popover";
import { SegmentedControl } from "../segmented-control/SegmentedControl";
import { Table, type SortState, type TableColumnDef, type TableRow } from "./Table";
import { useTable } from "./use-table";

export interface TableViewProps {
  columns: TableColumnDef[];
  rows: TableRow[];
  caption?: string;
  hideCaption?: boolean;
  /** Optional title, rendered on the same row as the view controls. */
  title?: string;
  titleLevel?: 2 | 3 | 4 | 5 | 6;
  pageSize?: number;
  page?: number;
  /** Accessible name for the pagination nav. Defaults to the catalog's "Table pages". */
  paginationLabel?: string;
  onPageChange?: (page: number) => void;
  infinite?: boolean;
  hasMore?: boolean;
  loading?: boolean;
  onLoadMore?: () => void;
  /** Load-more button text. Defaults to the catalog's "Load more". */
  loadMoreLabel?: string;
  /** Loading status text. Defaults to the catalog's "Loading…". */
  loadingLabel?: string;
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  hiddenColumns?: string[];
  onHiddenColumnsChange?: (hidden: string[]) => void;
  view?: "table" | "card";
  allowViewToggle?: boolean;
  configurable?: boolean;
  /** Column-visibility dropdown label. Defaults to the catalog's "Columns". */
  configLabel?: string;
  cardTitleKey?: string;
  cardDescriptionKey?: string;
  getValue?: (row: TableRow, key: string) => unknown;
  getRowId?: (row: TableRow, index: number) => string | number;
}

/** The two body layouts offered by the view switcher. */
const VIEW_ITEMS = [
  { value: "table", label: "Table" },
  { value: "card", label: "Cards" },
];

/** The sliders glyph on the column-settings trigger. */
const SettingsGlyph = () =>
  h(
    Icon,
    { size: "1.15em" },
    {
      default: () => [
        h("line", { x1: "21", y1: "4", x2: "14", y2: "4" }),
        h("line", { x1: "10", y1: "4", x2: "3", y2: "4" }),
        h("line", { x1: "21", y1: "12", x2: "12", y2: "12" }),
        h("line", { x1: "8", y1: "12", x2: "3", y2: "12" }),
        h("line", { x1: "21", y1: "20", x2: "16", y2: "20" }),
        h("line", { x1: "12", y1: "20", x2: "3", y2: "20" }),
        h("line", { x1: "14", y1: "2", x2: "14", y2: "6" }),
        h("line", { x1: "8", y1: "10", x2: "8", y2: "14" }),
        h("line", { x1: "16", y1: "18", x2: "16", y2: "22" }),
      ],
    },
  );

/**
 * TableView — internal: the single-view body used by `TableSet`. It owns the
 * headless table state (sorting plus column visibility) for one set of
 * `columns`/`rows` and renders a header row (optional title, a table/cards
 * switcher, a column-settings button), the body inside a card (a `Table` or a
 * list of `Card`s), and, outside the card, the footer (pagination or infinite
 * scroll). `TableSet` adds the tabs that swap between several views. Kept out
 * of the package's public exports.
 */
export const TableView = defineComponent({
  name: "TableView",
  props: {
    columns: { type: Array as PropType<TableColumnDef[]>, required: true },
    rows: { type: Array as PropType<TableRow[]>, required: true },
    caption: { type: String, default: undefined },
    hideCaption: { type: Boolean, default: false },
    title: { type: String, default: undefined },
    titleLevel: { type: Number as PropType<2 | 3 | 4 | 5 | 6>, default: 2 },
    pageSize: { type: Number, default: undefined },
    page: { type: Number, default: 1 },
    paginationLabel: { type: String, default: undefined },
    onPageChange: { type: Function as PropType<(page: number) => void>, default: undefined },
    infinite: { type: Boolean, default: false },
    hasMore: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    onLoadMore: { type: Function as PropType<() => void>, default: undefined },
    loadMoreLabel: { type: String, default: undefined },
    loadingLabel: { type: String, default: undefined },
    sort: { type: Object as PropType<SortState | null>, default: null },
    onSortChange: {
      type: Function as PropType<(sort: SortState | null) => void>,
      default: undefined,
    },
    hiddenColumns: { type: Array as PropType<string[]>, default: () => [] },
    onHiddenColumnsChange: {
      type: Function as PropType<(hidden: string[]) => void>,
      default: undefined,
    },
    view: { type: String as PropType<"table" | "card">, default: "table" },
    allowViewToggle: { type: Boolean, default: false },
    configurable: { type: Boolean, default: false },
    configLabel: { type: String, default: undefined },
    cardTitleKey: { type: String, default: undefined },
    cardDescriptionKey: { type: String, default: undefined },
    getValue: {
      type: Function as PropType<(row: TableRow, key: string) => unknown>,
      default: (row: TableRow, key: string) => row[key],
    },
    getRowId: {
      type: Function as PropType<(row: TableRow, index: number) => string | number>,
      default: (row: TableRow, index: number) => (row.id as string | number) ?? index,
    },
  },
  setup(props, { slots }) {
    const i18n = useI18n();

    // There is always an active sort: default to the first sortable column.
    const defaultSort = (columns: TableColumnDef[]): SortState | null => {
      const firstSortable = columns.find((column) => column.sortable)?.key ?? null;
      return firstSortable ? { key: firstSortable, direction: "asc" } : null;
    };

    // The getter passes the raw sort prop, so the mirror watch inside
    // useTable sees a later controlled change. A computed default would gain
    // a new identity on every unrelated recompute and undo local interactions,
    // so the first-sortable default is applied explicitly instead.
    const { api, setSort, syncSort, toggleColumnVisibility } = useTable(() => ({
      columns: props.columns,
      sort: props.sort,
      hiddenColumns: props.hiddenColumns,
      onSortChange: props.onSortChange,
      onHiddenColumnsChange: props.onHiddenColumnsChange,
    }));
    syncSort(props.sort ?? defaultSort(props.columns));

    // An explicit null after mount is normalized back to the default: the
    // view's contract is that there is always an active sort. No callback.
    watch(
      () => props.sort,
      (next) => {
        if (next === null) syncSort(defaultSort(props.columns));
      },
    );

    // New columns keep the current sort while its key is still sortable;
    // otherwise the first sortable column takes over, without a callback.
    watch(
      () => props.columns,
      (columns) => {
        const current = api.value.sort;
        const stillSortable =
          current != null &&
          columns.some((column) => column.key === current.key && column.sortable);
        if (!stillSortable) syncSort(defaultSort(columns));
      },
    );

    // Two-state toggle (asc to desc and back): the table is never left unsorted.
    const toggleSort = (key: string) => {
      const current = api.value.sort;
      setSort(
        current && current.key === key
          ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
          : { key, direction: "asc" },
      );
    };

    // Controllable mirrors: reflecting a prop never calls a callback, and an
    // unchanged prop cannot undo a local interaction.
    const currentView = ref(props.view);
    const currentPage = ref(props.page);
    watch(
      () => props.view,
      (next) => {
        currentView.value = next;
      },
    );
    watch(
      () => props.page,
      (next) => {
        currentPage.value = next;
      },
    );

    const changePage = (next: number) => {
      currentPage.value = next;
      props.onPageChange?.(next);
    };

    const paginated = computed(() => !props.infinite && props.pageSize != null);
    const sortedRows = computed(() => api.value.sortRows(props.rows, props.getValue));
    const pageCount = computed(() =>
      paginated.value ? Math.max(1, Math.ceil(sortedRows.value.length / props.pageSize!)) : 1,
    );

    // The component clamps once when the current page falls out of range
    // (shrunken data, or an out-of-range controlled page), renders the clamped
    // page immediately and reports it through the existing callback exactly
    // once. Watching instead of clamping in render keeps state writes out of
    // the render function; unrelated rerenders reapply nothing.
    watch(
      () => [currentPage.value, pageCount.value] as const,
      ([current, count]) => {
        if (current > count) {
          currentPage.value = count;
          props.onPageChange?.(count);
        }
      },
      { immediate: true },
    );

    // The sentinel drives infinite scroll: it loads more as soon as the bottom
    // of the list comes into view.
    const sentinelRef = ref<HTMLElement | null>(null);
    watch(
      sentinelRef,
      (node, _previous, onCleanup) => {
        if (!node || typeof IntersectionObserver === "undefined") return;
        const observer = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting) && props.hasMore && !props.loading) {
            props.onLoadMore?.();
          }
        });
        observer.observe(node);
        onCleanup(() => observer.disconnect());
      },
      { flush: "post" },
    );

    onScopeDispose(() => (sentinelRef.value = null));

    return () => {
      const { t } = i18n.value;
      const resolvedPaginationLabel = props.paginationLabel ?? t("table.pagination");
      const resolvedLoadMoreLabel = props.loadMoreLabel ?? t("table.loadMore");
      const resolvedLoadingLabel = props.loadingLabel ?? t("table.loading");
      const resolvedConfigLabel = props.configLabel ?? t("table.columns");

      const titleKey = props.cardTitleKey ?? props.columns[0]?.key;
      const shownColumns = props.columns.filter((column) => api.value.isColumnVisible(column.key));
      const renderPage = Math.min(currentPage.value, pageCount.value);
      const visibleRows = paginated.value
        ? sortedRows.value.slice((renderPage - 1) * props.pageSize!, renderPage * props.pageSize!)
        : sortedRows.value;

      const cell = (row: TableRow, column: TableColumnDef, value: unknown, rowIndex: number) =>
        slots.cell ? slots.cell({ row, column, value, rowIndex }) : String(value ?? "");

      const header =
        props.title || props.allowViewToggle || props.configurable
          ? h("header", { class: "table-view__header" }, [
              props.title
                ? h(`h${props.titleLevel}`, { class: "table-view__title" }, props.title)
                : null,
              h("div", { class: "table-view__controls" }, [
                props.allowViewToggle
                  ? h(SegmentedControl, {
                      items: VIEW_ITEMS,
                      value: currentView.value,
                      label: "View",
                      hideLabel: true,
                      onValueChange: (next: string) =>
                        (currentView.value = next === "card" ? "card" : "table"),
                    })
                  : null,
                props.configurable
                  ? h(
                      Popover,
                      { placement: "bottom-end" },
                      {
                        trigger: () =>
                          h("span", { class: "table-view__settings" }, [
                            SettingsGlyph(),
                            h("span", { class: "table-view__sr" }, resolvedConfigLabel),
                          ]),
                        default: () =>
                          h(
                            "div",
                            {
                              class: "table-view__config-list",
                              role: "group",
                              "aria-label": resolvedConfigLabel,
                            },
                            props.columns.map((column) =>
                              h(Checkbox, {
                                key: column.key,
                                label: column.header,
                                checked: api.value.isColumnVisible(column.key),
                                disabled: column.hideable === false,
                                onCheckedChange: () => toggleColumnVisibility(column.key),
                              }),
                            ),
                          ),
                      },
                    )
                  : null,
              ]),
            ])
          : null;

      const body =
        currentView.value === "card"
          ? h(
              "div",
              { class: "table-view__cards", role: "list", "aria-label": props.caption },
              visibleRows.map((row, rowIndex) => {
                const fieldColumns = shownColumns.filter(
                  (column) => column.key !== titleKey && column.key !== props.cardDescriptionKey,
                );
                return h("div", { key: props.getRowId(row, rowIndex), role: "listitem" }, [
                  h(
                    Card,
                    {
                      title: titleKey != null ? String(props.getValue(row, titleKey)) : undefined,
                      description:
                        props.cardDescriptionKey != null
                          ? String(props.getValue(row, props.cardDescriptionKey))
                          : undefined,
                    },
                    {
                      default: () =>
                        h(
                          "dl",
                          { class: "table-view__card-fields" },
                          fieldColumns.map((column) => {
                            const value = props.getValue(row, column.key);
                            return h("div", { key: column.key, class: "table-view__card-field" }, [
                              h("dt", { class: "table-view__card-label" }, column.header),
                              h(
                                "dd",
                                { class: "table-view__card-value" },
                                cell(row, column, value, rowIndex),
                              ),
                            ]);
                          }),
                        ),
                    },
                  ),
                ]);
              }),
            )
          : h("div", { class: "table-view__card" }, [
              h(
                Table,
                {
                  columns: shownColumns,
                  rows: visibleRows,
                  sort: api.value.sort,
                  onSortToggle: toggleSort,
                  caption: props.caption,
                  hideCaption: props.hideCaption || Boolean(props.title),
                  getValue: props.getValue,
                  getRowId: props.getRowId,
                },
                slots.cell ? { cell: slots.cell } : undefined,
              ),
            ]);

      const footer = props.infinite
        ? h("div", { class: "table-view__infinite" }, [
            h(
              "p",
              { class: "table-view__status", role: "status", "aria-live": "polite" },
              props.loading ? resolvedLoadingLabel : "",
            ),
            props.hasMore
              ? h(
                  "button",
                  {
                    type: "button",
                    class: "table-view__load-more",
                    disabled: props.loading,
                    onClick: () => props.onLoadMore?.(),
                  },
                  props.loading ? resolvedLoadingLabel : resolvedLoadMoreLabel,
                )
              : null,
            h("div", { class: "table-view__sentinel", ref: sentinelRef, "aria-hidden": "true" }),
          ])
        : paginated.value && pageCount.value > 1
          ? h("div", { class: "table-view__pagination" }, [
              h(Pagination, {
                page: renderPage,
                pageCount: pageCount.value,
                label: resolvedPaginationLabel,
                onPageChange: changePage,
              }),
            ])
          : null;

      return h("div", { class: "table-view" }, [header, body, footer]);
    };
  },
});
