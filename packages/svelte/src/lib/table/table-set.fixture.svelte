<script lang="ts">
  import TableSet from "./TableSet.svelte";
  import type { TableColumnDef, TableRow } from "./Table.svelte";

  import type { SortState } from "./create-table";

  interface Props {
    pageSize?: number;
    page?: number;
    view?: "table" | "card";
    allowViewToggle?: boolean;
    configurable?: boolean;
    infinite?: boolean;
    hasMore?: boolean;
    loading?: boolean;
    caption?: string;
    onLoadMore?: () => void;
    sort?: SortState | null;
    hiddenColumns?: string[];
    onPageChange?: (page: number) => void;
    onSortChange?: (sort: SortState | null) => void;
    onHiddenColumnsChange?: (hidden: string[]) => void;
    columns?: TableColumnDef[];
    rows?: TableRow[];
  }

  let {
    pageSize,
    page = 1,
    view = "table",
    allowViewToggle = false,
    configurable = false,
    infinite = false,
    hasMore = false,
    loading = false,
    caption = "People",
    onLoadMore,
    sort = null,
    hiddenColumns = [],
    onPageChange,
    onSortChange,
    onHiddenColumnsChange,
    columns = [
      { key: "name", header: "Name", sortable: true, hideable: false },
      { key: "age", header: "Age", sortable: true, align: "end" },
      { key: "city", header: "City" },
    ],
    rows = [
      { id: 1, name: "Ada", age: 36, city: "London" },
      { id: 2, name: "Grace", age: 85, city: "New York" },
      { id: 3, name: "alan", age: 41, city: "London" },
      { id: 4, name: "Edsger", age: 60, city: "Rotterdam" },
      { id: 5, name: "Barbara", age: 80, city: "Boston" },
    ],
  }: Props = $props();
</script>

<TableSet
  {columns}
  {rows}
  {pageSize}
  {page}
  {sort}
  {hiddenColumns}
  {onPageChange}
  {onSortChange}
  {onHiddenColumnsChange}
  {view}
  {allowViewToggle}
  {configurable}
  {infinite}
  {hasMore}
  {loading}
  {onLoadMore}
  title="People"
  {caption}
/>
