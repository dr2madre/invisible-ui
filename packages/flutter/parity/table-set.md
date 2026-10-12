# TableSet parity checklist

Reference commit: `065c59ab34f5cdef8e55d8014dfbbd3efc52396c`

Reference paths: `core/src/table` `packages/svelte/src/lib/table` `docs/data-table-spec.md`

The Flutter `TableSet` and its internal `TableView` checked against the
Svelte `TableSet` and `TableView`
(`packages/svelte/src/lib/table/TableSet.svelte`, `TableView.svelte`),
`core/src/table` and
[`docs/data-table-spec.md`](../../../docs/data-table-spec.md) units 5A
(controlled contracts), 5B (selection) and 5C (filtering).
Docs page: [Table Set](https://dr2madre.github.io/invisible-ui/components/patterns/table-set/).

Table View stays internal, as the data table spec fixes for every adapter:
apps reach it through `TableSet`, with one view for a single table. It is
counted as covered by this checklist.

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/table_set_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `TableSet<T>(columns:, rows:)` or `views: [TableSetView(...)]` | `columns`, `rows`, `views` | one view or tabs |
| `activeView`, `onViewChanged`, `viewsLabel` | the same names (`onViewChange`) | controllable active tab |
| `page`, `onPageChanged`, `pageSize`, `paginationLabel` | `page`, `onPageChange`, … | controllable page |
| `sort`, `onSortChanged` | `sort`, `onSortChange` | controllable sort |
| `hiddenColumns`, `onHiddenColumnsChanged`, `configurable`, `configLabel` | the same names | controllable column visibility |
| `viewMode: TableViewMode`, `allowViewToggle` | `view: "table" \| "card"`, `allowViewToggle` | controllable table or cards; renamed beside `views` |
| `selectionMode`, `selectedRowIds`, `onSelectedRowIdsChanged`, `isRowSelectable`, `getRowLabel` | the same names | controlled selection (5B) |
| `filtersActive`, `totalRowCount`, `filterRevision`, `onClearFilters`, `noResultsLabel` | the same names | filtering coordination (5C) |
| `infinite`, `hasMore`, `loading`, `onLoadMore`, `loadMoreLabel`, `loadingLabel` | the same names | loading more |
| `title`, `headingLevel`, `caption`, `hideCaption`, `toolbar`, `cellBuilder` | `title`, `titleLevel`, …, `toolbar` and `cell` snippets | chrome and content |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Always sorted: the first sortable column ascending by default | matched | `the first sortable column sorts by default; …` |
| A header press switches between ascending and descending (two states), reported once | matched | same test |
| Controllable mirrors: a changed prop shows without a report; an unrelated rebuild keeps the user's choice (5A) | matched | `settings are controllable mirrors: …` |
| New columns keep the sort while its column is still sortable | matched | `didUpdateWidget`, same rule as the Svelte columns mirror |
| Rows that shrink under the page clamp once, reported once (5A) | matched | `rows that shrink under the current page show the last page, reported once` |
| A disappearing active view gives way to the first, without a report (5A) | matched | `views are tabs: …` |
| Selection: unique ids in selection order, single replaces, none is inert (5B) | matched | `multiple selection: …`, `single selection replaces the row …`, and the shared vectors |
| Select-all covers the selectable rows shown; mixed state; ids outside the page kept (5B) | matched | `multiple selection: …` |
| Rows that cannot be selected show no checkbox | matched | same test |
| Missing or duplicate ids, missing row labels fail in development (5B) | matched | `selection without row labels fails in debug builds`; a `FlutterError` in debug builds, the same degraded result in release |
| Selection never pruned by paging, sorting or filtering | matched | `a filter change returns to page one, reported once; the selection stays; …` |
| Empty dataset versus no results (5C) | matched | `an empty dataset is an empty table, not a no-results state`, `no results: …` |
| A filter signal or revision change returns to page one, reported once (5C) | matched | `a filter change returns to page one, …` |
| Focus moves to the view after the clear action brings rows back (5C) | matched | `no results: …` |
| Load more: a button that waits while loading | matched | `loading more: …` |
| Load more when the end of the list scrolls into view | adapted | the widgets layer has no intersection observer; the button is the path, and an app that wants automatic loading calls `onLoadMore` from its own scroll listener |
| Card view: a list of cards, title and description from columns, other columns as label and value | matched | `the card view is a named list of cards, …` |
| Column list: a checkbox per column, the columns that cannot hide disabled | matched | `the column list hides a column; …` |
| Views as tabs, only the active view built | matched | `views are tabs: …` |
| Reports run after the frame | adapted | a report caused by new props (page reset, clamp) runs after the frame, since the app cannot rebuild while the set updates; one report per change, as on the web |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The table's semantics | matched | see [table.md](table.md) |
| Selection checkboxes named "Select {name}", the select-all "Select all visible rows" with a mixed state | matched | `multiple selection: …` |
| Single mode: the header cell is named "Selection" | matched | `single selection replaces the row …` |
| No-results state is a status | matched | `EmptyState(live: true)` |
| A change of the row count under filters is announced ("3 results") | matched | `a filter change returns to page one, …`; the Elements adapter does this; Svelte, Vue and React do not (an open point) |
| Loading is announced | matched | `loading more: …` |
| The card list is a named list of items; a selectable card reports its selected state | matched | `the card view is a named list of cards, …` |
| The column list is a group named by the button | matched | `_ColumnList` |
| Screen reader output | not yet verified | Assistive technology: not tested |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The table in a bordered card; footer outside | matched | `TableView.build` |
| Header row with the title and the controls, wrapping | matched | `Wrap` |
| Column settings button | adapted | the Popover trigger is a button with the visible text "Columns" (`table.columns`) instead of an icon with a hidden name: the widgets layer bundles no icon set, and a visible label serves every user |
| View switch labels from the catalog | matched | `table.view`, `table.viewTable`, `table.viewCards`; the Svelte switch writes "View", "Table" and "Cards" in English (an open point) |
| Cards as many across as fit, at least 256 wide, scaled with the text | matched | `_Cards` |
| Narrow at text scale 2.0, right to left: nothing overflows; 44 by 44 under touch | matched | `narrow at text scale 2.0 and right to left: …` |
