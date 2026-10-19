# Table parity checklist

Reference commit: `f2943333bf31794885e523ca48b6dd87f189d5af`

Reference review (2026-10-18): checked the token-model change in the Svelte
reference. Behavior and accessibility markup did not change; CSS token names
changed, with resolved Light/Dark values checked by the token runtime tests.

Reference paths: `core/src/table` `packages/svelte/src/lib/table` `docs/data-table-spec.md`

The Flutter `Table` checked against the Svelte `Table`
(`packages/svelte/src/lib/table/Table.svelte`), `core/src/table` and
[`docs/data-table-spec.md`](../../../docs/data-table-spec.md).
Docs page: [Table](https://dr2madre.github.io/invisible-ui/components/patterns/table/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/table_test.dart`
that holds it. The sort cycle, the cell comparison, the stable sort and the
selection transitions also answer the shared vectors in
`core/src/table/__vectors__` (`test/data_vectors_test.dart`).

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Table<T>(columns:, rows:)` | `columns`, `rows` | the data; rows are any type, read with `getValue` |
| `TableColumn(key:, header:, sortable:, hideable:, align:)` | `TableColumnDef` | the column definition; `align` is `TableAlign.start`, `center` or `end` |
| `sort: TableSort?` | `sort` | the controlled sort; `TableSort(key, SortDirection.ascending)` for `{ key, direction: "asc" }` |
| `onSortToggle: ValueChanged<String>` | `onSortToggle` | a sortable header was pressed |
| `nextSort`, `sortRows` | `nextSort`, `sortRows` from core | the three-state cycle and the stable sort |
| `caption`, `hideCaption` | the same names | the table's name |
| `getValue`, `getRowId` | the same names | value reader and row key |
| `cellBuilder` | `cell` snippet | custom cell content, from `TableCellDetails` |
| `selectionColumn`, `isRowSelected`, `selectionHeader`, `selectionCellBuilder` | `selectionColumn`, `isRowSelected`, `selectionHeader`, `selectionCell` | the structural selection column |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Renders the given columns and rows; cells show the value as text | matched | `semantics: a table named by its caption, with rows, column headers and cells` |
| Controlled: reports a header press with the key, sorts nothing itself | matched | `a header press reports its key once; the new sort is shown and announced` |
| Three-state cycle with `nextSort`, stable `sortRows`, nulls last | matched | same test, and the shared vectors |
| Text comparison: case-insensitive, digit runs as numbers | adapted | Dart has no locale collation in the widgets layer; `compareCellValues` folds case and Latin-1 accents and compares digit runs by number, which agrees with the web for letters, digits and spaces (the vectors' range); punctuation and other scripts order by code point |
| Enter and Space press a sortable header | matched | `Enter and Space press a focused header` |
| Custom cells and value reader | matched | `a cell builder and a value reader build the cells; a hidden caption still names the table` |
| Selection column first, filled by the app | matched | `the selection column holds the app's controls` |
| Selected rows tinted (`data-selected`) | matched | `isRowSelected` paints the row with the selection colour at 8% |
| Row hover tint | matched | each cell reports the pointer to its row |
| Cell content measured for its column | adapted | each column takes its widest cell (`IntrinsicColumnWidth`), so a cell builder returns widgets that report their size ahead of layout (text, icons, buttons; a `LayoutBuilder` cannot). The selection column has a fixed width for the same reason, since a checkbox is a field |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A real table: table, rows, cells, column headers | matched | Flutter's own `Table` gives the table and row roles; header cells take `SemanticsRole.columnHeader` and body cells `SemanticsRole.cell`: `semantics: …` |
| `<caption>` names the table | adapted | Flutter's table node takes no name of its own; a container named by the caption holds it, and the visible caption is not read twice: same test |
| `aria-sort` on sortable headers | adapted | Flutter semantics have no sort property; the header button's value says "sorted ascending" or "sorted descending" (`table.sortedAscending`, `table.sortedDescending`, catalog keys added for this), and the new sort is announced politely after the user's press: `a header press reports …` |
| `aria-sort="none"` on a sortable header not sorted now | adapted | no value; the header is still a button: `semantics: …` |
| Row headers | out of scope | the web marks none (`<td>` only), and Flutter's semantics have no row header role |
| Screen reader output on macOS, Windows, Linux, iOS, Android | not yet verified | Assistive technology: not tested |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Header labels in the secondary text colour, bold; the sorted header in the selection colour with an arrow | matched | `_HeaderCell`; the arrow shape says the direction, so colour is never the only cue |
| Unsorted sortable headers show a faint up and down hint | matched | `GlyphShape.sortable` at 40%, 70% on hover |
| Alignment per column, mirrored right to left | matched | `right to left: the first column sits at the right` |
| A table wider than its container | adapted | the table scrolls sideways and the scroller takes focus only while it overflows, so the keyboard reaches every column and a table that fits adds no tab stop: `a table wider than its container scrolls sideways …`. While it takes focus, the scroller is a region named by the caption, or "Table" (`table.viewTable`), as Table Set's card is on the web. The web table wraps its cells instead. Inside Table Set's card the web scrolls a table that still does not fit, and the card is a focusable named region only while it overflows (`scrollArea.observeInlineOverflow`); see [table-set.md](table-set.md) |
| Targets 24 by 24, 44 by 44 under touch; text contrast | matched | `targets: 24 by 24, 44 by 44 under touch; text contrast` |
