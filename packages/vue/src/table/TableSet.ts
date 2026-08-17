import { computed, defineComponent, h, ref, watch, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";
import { useTabs } from "../tabs/use-tabs";
import type { SortState, TableColumnDef, TableRow } from "./Table";
import { TableView } from "./TableView";

/** A named table view (a tab): its own columns plus rows. */
export interface TableViewDef {
  /** Stable id (the tab value). */
  id: string;
  /** Tab label. */
  label: string;
  columns: TableColumnDef[];
  rows: TableRow[];
  /** Optional accessible name for this view's table/list (defaults to `label`). */
  caption?: string;
}

export interface TableSetProps {
  /** Single-view data (used when `views` is not provided). */
  columns?: TableColumnDef[];
  rows?: TableRow[];
  /** Distinct views shown as tabs; each supplies its own columns and rows. */
  views?: TableViewDef[];
  /**
   * The active view id. Controllable mirror: selecting a tab updates it
   * locally and reports through `onViewChange`; a later prop value overwrites
   * the local choice without a callback. Defaults to the first view.
   */
  activeView?: string;
  /** Accessible name for the views tab list. Defaults to the catalog's "Views". */
  viewsLabel?: string;
  /** Called when the active view changes. */
  onViewChange?: (id: string) => void;
  /** Optional title shown in the header (rendered as a heading). */
  title?: string;
  titleLevel?: 2 | 3 | 4 | 5 | 6;
  /** Accessible name for the table/list (a `<caption>` in table view). */
  caption?: string;
  hideCaption?: boolean;
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

/**
 * TableSet — the composed data-table shell around the pure `Table`, ported from
 * the Svelte adapter. It adds the chrome and owns the per-view state (sorting
 * plus column visibility, via the internal `TableView`):
 *
 * - a header with an optional `title` and a `toolbar` slot;
 * - optional **tabs** that switch between several distinct views (`views`),
 *   each with its own columns and rows: selecting a tab swaps the whole table;
 * - per view: a table/cards switcher, a column-visibility config dropdown, the
 *   body (a `Table` or a list of `Card`s), and pagination or infinite scroll in
 *   the footer.
 *
 * Without `views`, it renders a single view from `columns`/`rows`. Cells render
 * `row[column.key]` by default or through the scoped `cell` slot
 * (`{ row, column, value, rowIndex }`). Themed via `--ds-table-*`.
 */
export const TableSet = defineComponent({
  name: "TableSet",
  props: {
    columns: { type: Array as PropType<TableColumnDef[]>, default: () => [] },
    rows: { type: Array as PropType<TableRow[]>, default: () => [] },
    views: { type: Array as PropType<TableViewDef[]>, default: undefined },
    activeView: { type: String, default: undefined },
    viewsLabel: { type: String, default: undefined },
    onViewChange: { type: Function as PropType<(id: string) => void>, default: undefined },
    title: { type: String, default: undefined },
    titleLevel: { type: Number as PropType<2 | 3 | 4 | 5 | 6>, default: 2 },
    caption: { type: String, default: undefined },
    hideCaption: { type: Boolean, default: false },
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

    // Reactive views: appearing, changing or disappearing after mount follows
    // the prop, with no remount of the set required.
    const views = computed(() => props.views ?? []);
    const hasViews = computed(() => views.value.length > 0);
    const activeId = ref(props.activeView ?? views.value[0]?.id ?? "");

    // Controllable mirrors, callback-free: a later activeView prop overwrites
    // the local choice; a disappearing active id falls back to the first
    // remaining view without onViewChange.
    watch(
      () => props.activeView,
      (next) => {
        if (next !== undefined) activeId.value = next;
      },
    );
    watch(views, (next) => {
      if (next.length > 0 && !next.some((view) => view.id === activeId.value)) {
        activeId.value = next[0]!.id;
      }
    });

    // A stable computed identity keeps useTabs' items watch quiet on
    // unrelated recomputes.
    const tabItems = computed(() => views.value.map((view) => ({ value: view.id })));

    // A tab list drives which view is active (only when `views` is given).
    const tabs = useTabs(() => ({
      items: tabItems.value,
      value: activeId.value,
      onValueChange: (id: string) => {
        activeId.value = id;
        props.onViewChange?.(id);
      },
    }));

    /** Everything a `TableView` needs beyond its own columns, rows and caption. */
    const viewConfig = () => ({
      hideCaption: props.hideCaption,
      pageSize: props.pageSize,
      page: props.page,
      paginationLabel: props.paginationLabel,
      onPageChange: props.onPageChange,
      infinite: props.infinite,
      hasMore: props.hasMore,
      loading: props.loading,
      onLoadMore: props.onLoadMore,
      loadMoreLabel: props.loadMoreLabel,
      loadingLabel: props.loadingLabel,
      sort: props.sort,
      onSortChange: props.onSortChange,
      hiddenColumns: props.hiddenColumns,
      onHiddenColumnsChange: props.onHiddenColumnsChange,
      view: props.view,
      allowViewToggle: props.allowViewToggle,
      configurable: props.configurable,
      configLabel: props.configLabel,
      cardTitleKey: props.cardTitleKey,
      cardDescriptionKey: props.cardDescriptionKey,
      getValue: props.getValue,
      getRowId: props.getRowId,
    });

    const cellSlot = () => (slots.cell ? { cell: slots.cell } : undefined);

    return () => {
      const { t } = i18n.value;
      const resolvedViewsLabel = props.viewsLabel ?? t("table.views");

      const header =
        (props.title && hasViews.value) || slots.toolbar || hasViews.value
          ? h("header", { class: "table-set__header" }, [
              props.title && hasViews.value
                ? h(`h${props.titleLevel}`, { class: "table-set__title" }, props.title)
                : null,
              slots.toolbar?.(),
              hasViews.value
                ? h(
                    "div",
                    {
                      ...tabs.api.value.rootProps,
                      ref: tabs.listRef,
                      class: "table-set__tabs",
                      "aria-label": resolvedViewsLabel,
                    },
                    views.value.map((view) =>
                      h(
                        "button",
                        {
                          ...tabs.api.value.getTabProps(view.id),
                          key: view.id,
                          class: "table-set__tab",
                        },
                        view.label,
                      ),
                    ),
                  )
                : null,
            ])
          : null;

      const body = hasViews.value
        ? views.value.map((view) =>
            h(
              "div",
              { ...tabs.api.value.getPanelProps(view.id), key: view.id },
              view.id === activeId.value
                ? [
                    // Keyed on the active view so switching tabs remounts the
                    // body: each view starts from its own default sort.
                    h(
                      TableView,
                      {
                        key: activeId.value,
                        columns: view.columns,
                        rows: view.rows,
                        caption: view.caption ?? view.label,
                        ...viewConfig(),
                      },
                      cellSlot(),
                    ),
                  ]
                : undefined,
            ),
          )
        : [
            h(
              TableView,
              {
                columns: props.columns,
                rows: props.rows,
                title: props.title,
                titleLevel: props.titleLevel,
                caption: props.caption,
                ...viewConfig(),
              },
              cellSlot(),
            ),
          ];

      return h("section", { class: "table-set" }, [header, ...body]);
    };
  },
});
