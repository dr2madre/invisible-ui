# Data Grid parity checklist

Reference commit: `f2943333bf31794885e523ca48b6dd87f189d5af`

Reference review (2026-10-18): checked the token-model change in the Svelte
reference. Behavior and accessibility markup did not change; CSS token names
changed, with resolved Light/Dark values checked by the token runtime tests.

Reference paths: `core/src/grid` `docs/editable-grid-spec.md`

The Flutter `DataGrid` checked against the behaviour spec
[`docs/editable-grid-spec.md`](https://github.com/dr2madre/invisible-ui/blob/main/docs/editable-grid-spec.md),
whose "Decisions taken" section is binding, and the headless grid in
`core/src/grid` (`keyboard.ts`, `active.ts`, `totals.ts`, `label.ts` and the
shared vectors). The web adapters come after Flutter, so there is no Svelte
reference yet: the spec is the reference. Timelog's weekly timesheet is the
driving case.

Each line is **matched**, **adapted** (with the platform reason), **out of
scope** or **not yet verified**. Every matched line names the widget test in
`test/data_grid_test.dart` that holds it, or the vector group in
`test/data_grid_vectors_test.dart`.

Assistive technology: not tested. What VoiceOver, TalkBack, Narrator or
Orca say on these cells is a manual check, with no dated session yet.

## Names

| Flutter | Spec (web names) | ADR 0011 meaning |
| --- | --- | --- |
| `DataGrid` | `DataGrid` | controlled only: the data always comes from the app, so no `.uncontrolled` constructor |
| `columns: List<DataGridColumn>` | `columns` | `DataGridColumn(id:, label:, header:, secondaryLabel:, editor:)`; a non-null `secondaryLabel` is the web's `secondary` with its label, so the emphasis cannot come without its words; `header` is the visible content, `label` the read name |
| `rows: List<DataGridRow>` | `rows` | `DataGridRow(id:, code:, name:)`; `label` joins code and name |
| `cell: (rowId, columnId) => DataGridCell` | `cell(rowId, columnId)` | `DataGridCell(kind:, value:, badge:, secondaryLabel:, error:)`; `secondaryLabel` as on the column; `value` is a `double?` |
| `DataGridCellKind.editable / summary / readOnly` | `"editable" / "summary" / "readonly"` | Dart casing |
| `editor: DataGridEditor(min:, max:, step:, locale:, symbols:)` | `editor` | the Number Field settings; a column's `editor` wins |
| `formatValue: (double) => String` | `formatValue(value)` | visible text; null shows nothing |
| `valueText: (double?) => String` | `valueText(value)` | read text; defaults to the visible text and the catalog's "empty" |
| `totals: DataGridTotals.derived / none` | `totals: "derived" / "none"` | an enum |
| `rowTotalPosition: DataGridRowTotalPosition.end / start` | the row total position option (decision 5) | trailing by default |
| `totalError`, `rowTotalError` | `totalError`, `rowTotalError` | errors on derived totals |
| `hasDetails` | `hasDetails` | default: every editable and summary cell |
| `detailsShortcut: SingleActivator?` | `detailsShortcut` | Flutter's own key combination type; no default |
| `detailsShortcutLabel` | none | the shortcut's text in the hint, for a translated key name; defaults to "Alt+Enter"-style text |
| `activationHint` | the consumer's activation hint | a summary cell's hint ("Show entries") |
| `rowHeaderLabel`, `rowHeaderWidth` | none, the row header's consumer width | the header over the row headers, and the row header column's width at text scale 1 |
| `label`, `hideLabel` | `label` or `labelledBy` | the grid's name, shown above it unless hidden |
| `onCellChanged(DataGridCellChange)` | `onCellChange` | once per commit that moves a number, after the totals; `rowId`, `columnId`, `value`, `previousValue`, `error` (`NumberFieldError?`) |
| `onCellActivated(DataGridCellRef)` | `onCellActivate` | once per activation of a summary cell |
| `onCellDetails(DataGridCellRef)` | `onCellDetails` | once per details action |
| `DataGridState.valueOf`, `rowTotal`, `columnTotal`, `grandTotal`, `activeCell`, `isEditing` | the grid a handler reads | what the cells show now, so a handler sees the new totals |
| `gridCellLabel`, `sumGridValues`, `gridTotals` | `cellLabel`, `sumValues`, `gridTotals` in `core/src/grid` | the words and numbers an app's card view reuses |

## Data model

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Columns with a label and visible header content; rows with code and name, both visible | matched | `the headers, the cells, the secondary label and the totals` |
| Row and column ids are unique; a repeated id throws in development | matched | `repeated row ids throw in development` |
| Editable cell: the formatted value, nothing when null | matched | `a digit, F2, Backspace and Delete start editing with the draft the spec gives` (empty after a null commit) |
| Summary cell: the value and the badge; Enter and a press call `onCellActivated`; typing is ignored | matched | `a summary cell activates on Enter and on a press; typing does nothing` |
| Read-only cell: the value; Enter does nothing; a press makes it active | matched | `arrows move without wrapping; Home, End, Control+Home and Control+End jump` (row headers and totals are read-only) |
| Row headers, row totals, column totals and the grand total are read-only cells the grid derives | matched | `one composed label per cell, in the spec order` |
| Column headers are not focusable | matched | `one tab stop: Tab enters on the first editable cell and leaves on the next Tab` |
| Secondary emphasis per column: label in the column header, read with every cell | matched | `the headers, the cells, the secondary label and the totals`, `table, row, cell and column header roles` |
| Secondary emphasis per cell: label inside the cell | matched | `a cell's own secondary label shows inside the cell` |
| A secondary cell keeps its kind and stays editable; the surface is the `grid-cell-secondary-surface` role and adds to the text | matched | `a secondary cell stays editable, shows its label and the role surface` |
| Errors from the editor's validity (parse, range, step) with the Number Field messages | matched | `a draft that does not parse never commits and keeps editing with its error`, `a number out of range commits with its error, keeps it and announces it once` |
| Errors from the app: a cell's `error`, `totalError`, `rowTotalError` | matched | `one composed label per cell, in the spec order`, `the application's error on a total is announced once after the commit that causes it` |
| An error shows an icon and its message; the message shows on focus and hover and is always in the label | adapted | the message shows below the cell in an overlay, out of semantics, so the row height never changes: `an error shows its icon at rest and its message on focus and on hover, out of semantics` |
| Totals skip null; only null totals null, shown empty and read as "empty" | matched | totals vectors |
| Totals round to the decimals of their terms (0.1 + 0.2 is 0.3) | matched | totals vectors |
| Summary and read-only body cells count in the totals | matched | the totals sum every body value; `gridTotals` vectors |
| Totals recompute after each commit, before the report | matched | `Enter edits with the value selected, Enter commits, stays on the cell and reports once after the totals` |
| `totals: none` shows no Total column and no totals row | matched | `totals none shows no Total column and no totals row` |
| Row total: a read-only cell with its own column header, trailing or right after the row header, structure, view and keys together (decision 5) | matched | `the row total sits after the row header when asked, in structure, view and keyboard order` |

## Navigation mode

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Every row of the navigation key table, in both directions, for each kind | matched | keyboard vectors (`grid-keyboard.json`) |
| Arrows toward inline-end and inline-start; no wrap at the edges | matched | `arrows move without wrapping; Home, End, Control+Home and Control+End jump` |
| ArrowDown and ArrowUp, the totals row included; no wrap | matched | same test |
| Home and End: the row header and the row total | matched | same test |
| Control+Home: the first cell of the first body row; Control+End: the grand total | matched | same test |
| Page Down and Page Up by the body rows fully visible, stopping at the ends | matched | `PageDown moves by the visible body rows and keeps the active cell clear of the sticky rows` |
| Enter, F2, an accepted character, Backspace and Delete on an editable cell start editing with the select, end, replace and clear drafts | matched | `Enter edits with the value selected, Enter commits, stays on the cell and reports once after the totals`, `a digit, F2, Backspace and Delete start editing with the draft the spec gives` |
| Accepted characters: the locale's digits, Arabic-Indic and Persian digits in any locale, the decimal separator, the minus sign when `min` is below 0; never with Control, Meta or Alt; never during composition | matched | keyboard vectors; `Arabic-Indic and Persian digits start and fill a draft in any locale and commit ASCII numbers` |
| Escape is not handled: an enclosing dialog receives it | matched | `Escape is left to the widgets above` |
| Tab and Shift+Tab leave the grid; one tab stop, which returns to the active cell | matched | `one tab stop: Tab enters on the first editable cell and leaves on the next Tab` |
| The first active cell is the first editable body cell, or the first body cell | matched | same test; `initial active cell` vectors |
| The active cell scrolls into view with the nearest alignment, clear of the sticky headers | matched | `PageDown moves by the visible body rows and keeps the active cell clear of the sticky rows` |
| RTL: columns and arrows mirror; Home, End and Tab follow logical order; direction from `Directionality` | matched | `right to left mirrors the columns and the arrows` |

## Editing mode

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Every row of the editing key table | matched | keyboard vectors |
| The editor is the Number Field logic: draft and committed value, empty is null, locale digits, de-CH apostrophes | matched | `de-CH takes both apostrophes as group separators`, `Arabic-Indic and Persian digits start and fill a draft in any locale and commit ASCII numbers` |
| ArrowUp and ArrowDown step the draft, clamped, and report nothing (decision 6) | matched | `ArrowUp and ArrowDown step the draft and report nothing until F2 commits` |
| Enter commits and stays on the cell in navigation mode, which reads its new value (decision 2) | matched | `Enter edits with the value selected, Enter commits, stays on the cell and reports once after the totals` |
| F2 commits and returns to navigation | matched | `ArrowUp and ArrowDown step the draft and report nothing until F2 commits` |
| Escape reverts the draft, returns to navigation and is consumed; a second Escape reaches a dialog | matched | `Escape reverts and returns to navigation; a second Escape reaches the widgets above` |
| Tab commits and edits the next editable cell, Shift+Tab the previous one, skipping summary and read-only cells; after the last one focus moves on (decision 3) | matched | `Tab commits and edits the next editable cell, skipping a summary cell; Shift+Tab goes back; after the last one focus leaves` |
| The details shortcut commits, then calls `onCellDetails` | matched | `the shortcut works in both modes and commits first while editing` |
| Focus leaving the cell commits; the active cell stays | matched | `a press edits an editable cell; a press elsewhere commits` |
| A draft that does not parse never commits; Enter, F2, Tab and the shortcut keep editing with its error; Escape still reverts (decision 4) | matched | `a draft that does not parse never commits and keeps editing with its error` |
| Focus leaving the grid keeps an unparseable draft as typed; the next focus resumes it | matched | `a draft that does not parse is kept when focus leaves the grid and resumes when it comes back` |
| A press on another cell while the draft does not parse | adapted | the spec does not say; the draft keeps its cell and focus stays in the editor, so nothing typed is lost; Escape reverts first |
| Range and step violations commit with the error in the report and keep it (decision 4) | matched | `a number out of range commits with its error, keeps it and announces it once` |
| A commit that lands on the committed value reports nothing | matched | `a commit that lands on the same value reports nothing; a new value from the application reports nothing` |
| Mode by shape: a focus ring around the cell in navigation, a field border inside the cell while editing | matched | `high contrast draws the editing border in the text colour` (the border); the ring is the token ring drawn inside the cell |

## Details

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `onCellDetails` turns on a button for the cells `hasDetails` allows | matched | `the button names its cell, has a custom action and stays out of the tab order` |
| Visible on the active focused cell, on hover and while editing | matched | `the button shows on hover and on the focused cell, and a press on it keeps the mode` |
| Under a coarse pointer it shows on the active cell | adapted | `on a touch platform the active cell shows its button without hover or focus, as under a coarse pointer on the web`. Flutter has no pointer media query: it shows on the active cell on Android, iOS and Fuchsia (`InvisibleThemeData.touchPlatform`), under the touch density, or after a touch press |
| A button with the catalog's "Details" label and an icon | adapted | the button shows its icon (a chevron toward the inline end) and keeps a 24 or 44 target; "Details" is in its name and in the custom action, so the day columns stay narrow |
| Name: "Details" with the cell's context | matched | `the button names its cell, has a custom action and stays out of the tab order`; details vectors |
| Out of the tab order; reachable by pointer, by the shortcut and by the reading cursor | matched | same test |
| A press on the button calls `onCellDetails` and leaves the mode unchanged | matched | `the button shows on hover and on the focused cell, and a press on it keeps the mode` |
| The shortcut works in both modes; the grid has no default | matched | `the shortcut works in both modes and commits first while editing` |
| A custom semantics action "Details"; the shortcut in the hint | matched | `one composed label per cell, in the spec order`, `the button names its cell, has a custom action and stays out of the tab order` |

## Semantics and announcements

| Line | Status | Evidence or reason |
| --- | --- | --- |
| One focusable node per cell with one composed label: column, row, value text, badge, secondary label, error prefixed with "Error" | matched | `one composed label per cell, in the spec order`; label vectors |
| The separator and the order come from the catalog, so a locale can reorder them | matched | label vectors (Italian and Arabic reorder the parts) |
| Totals read "{column}, Total, {value}", "Total, {row}, {value}" and "Total, {value}" | matched | `one composed label per cell, in the spec order` |
| Row header: the row label and the row total | matched | same test |
| Hint: "Edit", the app's activation hint for summary cells, plus the details shortcut | matched | same test |
| Read-only and summary cells are read-only; an error marks the cell invalid | matched | same test (`isReadOnly`); `validationResult` is set where the SDK has it (3.35 and later) |
| Table, row, cell and column header roles as a bonus to the label | matched | `table, row, cell and column header roles` |
| No row and column positions in the label in v1 | matched | the labels name the row and the column only |
| The editor carries the cell's composed label and the spin actions | matched | the editor's field semantics take the cell's label, with increase and decrease when the draft has a value |
| No announcement for a new value or the totals on commit | matched | `a number out of range commits with its error, keeps it and announces it once` (only the error is announced) |
| An error that appears on commit, on the cell or on a total, is announced once, politely, as "{column}, {row}: {message}" | matched | `a number out of range commits with its error, keeps it and announces it once`, `the application's error on a total is announced once after the commit that causes it` |

## Focus after data changes and dialogs

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The active cell is held as a pair of ids; it stays when the pair exists, moves to the same position clamped when it does not | matched | `the active cell survives a removed row and keeps focus`; active cell vectors |
| Focus follows only when it was inside the grid | matched | same test (focus was inside); the move without focus leaves focus where it is |
| A dialog opened from `onCellActivated` or `onCellDetails` returns focus to the cell (ADR 0016) | matched | `focus returns to the cell a dialog was opened from` |
| A form reset discards the draft and ends editing (ADR 0012) | matched | `a form reset discards the draft and ends editing`; the grid holds no form value of its own |
| Undo of a committed change is the app's, built from `previousValue` (decision 7) | matched | `Enter edits with the value selected, Enter commits, stays on the cell and reports once after the totals` checks `previousValue` |

## Layout, size and look

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The grid scrolls on both axes inside its own area; the area is not a tab stop | matched | `text scale 2.0 at 320 wide: nothing overflows, the grid scrolls on both axes` |
| The column header row sticks to the top, the row header column to the inline start (mirrored), the totals row to the bottom | matched | `PageDown moves by the visible body rows and keeps the active cell clear of the sticky rows`, `text scale 2.0 at 320 wide: nothing overflows, the grid scrolls on both axes` |
| Day columns share one width that fits the widest value, badge or secondary label, and the details button | matched | the viewport gives the data columns and the Total column the widest cell's width |
| The row header column takes a consumer width; the name truncates and shows whole on hover and in the label | matched | `rowHeaderWidth`, scaled with the text and at most 40% of a bounded grid; the name has a tooltip that is only shown |
| Targets 24 by 24 under compact and regular, 44 by 44 under touch | matched | `targets of 24 by 24 at regular density`, `targets of 44 by 44 under touch density` |
| Text scale 2.0: rows and columns grow, nothing clips | matched | `text scale 2.0 at 320 wide: nothing overflows, the grid scrolls on both axes` |
| High contrast: the focus ring and the editing border in the text colour; the error icon and the secondary label stay as glyph and text | matched | `high contrast draws the editing border in the text colour` |
| Reduced motion: the active cell scrolls into view at once | matched | `under reduced motion the active cell scrolls into view at once` |
| Text contrast in both themes | matched | `targets of 24 by 24 at regular density` (light), `dark theme meets the text contrast guideline` |
| Scroll bars | adapted | the grid scrolls with the keyboard, the wheel and drag; no scroll bar is drawn, as the spec asks none |
| Narrow windows: the card view is the app's, with the grid's words and numbers | matched | `gridCellLabel`, `sumGridValues` and `gridTotals` are public |

## Performance and scope

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Every cell rendered, within the v1 budget of 100 rows by 31 columns | matched | the viewport lays out every row; a keystroke rebuilds the editing cell only |
| Virtualization, range selection, remote select-all | out of scope | deferred by the spec |
| The `tabWhileEditing` option of the spec's core sketch | adapted | decision 3 settled Tab while editing, so the core key table has no option for it; `GridCommit` carries the next cell or the direction out of the grid |
