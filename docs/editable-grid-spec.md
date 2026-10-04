# Editable data grid

An editable data grid is a table whose cells take keyboard focus one at a
time and whose number cells can be edited in place. This file is the
behaviour spec for every platform: `core/`, the web adapters (Svelte, Vue,
custom elements, React) and the Flutter adapter. It is the "specified once"
work named in [ADR 0017](./adr/0017-flutter-adapter.md) §6. The driving case
is Timelog's weekly timesheet: projects in rows, days in columns, hours in
the cells, totals per day and per project
([requirements](./proposals/flutter-adapter.md#editable-grid--requirements-for-the-cross-platform-spec)).

Status: proposed, waiting for the maintainer's answers to the
[open questions](#open-questions). Nothing here is built. The Data Table
([`data-table-spec.md`](./data-table-spec.md)) deferred grid semantics and
editing on purpose; this spec picks up those two deferrals and leaves the
others (range selection, remote select-all, virtualization) deferred.

## Pattern

- [WAI-ARIA APG Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/):
  the data grid keyboard map, the single tab stop, the switch between
  navigation and editing, `aria-readonly`, `rowheader` and `columnheader`.
- [APG data grid examples](https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/data-grids/):
  focusable cells, `aria-rowindex` and `aria-colindex`.
- [ADR 0011](./adr/0011-state-and-callback-conventions.md): controllable
  mirror, one report per action, report after commit.
- [ADR 0012](./adr/0012-form-reset.md): the grid is a display of consumer
  data; it holds no form value of its own (see [Commit](#commit-semantics-and-callbacks)).
- [ADR 0016](./adr/0016-feedback-while-a-dialog-is-open.md): focus returns to
  the cell when a dialog opened from it closes.
- Number Field (`core/src/number-field`): draft and committed value, empty
  distinct from 0, parse and range errors, Escape consumed only when it undid
  something.

## Prior art

Read on 2026-10-04.

| Decision | Observed | Who | Ours |
| --- | --- | --- | --- |
| Where editing lives | A native table; the app renders inputs in cells and updates its data on blur through table meta | [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/radix/data-table) over [TanStack Table's editable example](https://tanstack.com/table/v8/docs/framework/react/examples/editable-data), [shadcn-svelte Data Table](https://shadcn-svelte.com/docs/components/data-table) | A grid component with cell kinds and one commit callback |
| | No table or grid primitive | [Bits UI](https://bits-ui.com/docs/components) | |
| | The core Data Table covers sorting, selection, expansion and pagination; inline editing is an open request, and the product library's Datagrid adds it | [Carbon Data Table usage](https://carbondesignsystem.com/components/data-table/usage/), [carbon#2649](https://github.com/carbon-design-system/carbon/issues/2649), [ibm-products#5387](https://github.com/carbon-design-system/ibm-products/issues/5387) | |
| Roles | `role="grid"`, `aria-rowindex` and `aria-colindex` with the visible index | [AG Grid accessibility](https://www.ag-grid.com/javascript-data-grid/accessibility/) | Same, 1-based positions in the whole grid |
| Start editing | Enter, F2, a printable character (it becomes the first character typed), Backspace, double click | [AG Grid start and stop editing](https://www.ag-grid.com/javascript-data-grid/cell-editing-start-stop/) | Enter, F2, an accepted character, Backspace and Delete, a press |
| Stop editing | Enter accepts, Escape discards, Tab accepts and edits the next cell, focus loss accepts | AG Grid | Same, with Tab as [question 3](#open-questions) |
| Escape | "restores grid navigation. If content was being edited, it may also undo edits" | APG Grid | Reverts the draft and returns to navigation |
| Tab | One tab stop for the grid; while editing, Tab "moves focus to the next widget in the grid" | APG Grid | Navigation: leaves the grid. Editing: question 3 |
| Virtualization | Screen readers expect every row loaded; turn row and column virtualization off for them | AG Grid accessibility | Out of scope in v1 |

## Data model

### Structure

```text
              | column header × N (day, month, weekday) | Total column |
row header    | cell × N                                 | row total    |   × M body rows
"Total"       | column total × N                         | grand total  |   totals row
```

- **Columns.** An ordered list. Each column has an `id`, an accessible
  `label` ("Monday 6 October") and visible header content (the Timelog
  header shows day number, month and weekday). The visible content contains
  the words of the label, abbreviated if needed.
- **Rows.** An ordered list. Each row has a stable `id` and a row header with
  `code` and `name` (both visible). The row label used in announcements is
  `code` and `name` joined ("PX-12 Project X").
- **Row total.** The sum of the row's cell values, in a trailing Total
  column with its own column header (recommended in
  [question 4](#open-questions); Timelog's proposal shows it inside the row
  header).
- **Totals row.** A last row with the header "Total" (from the message
  catalog). Each of its cells sums the column; the cell under the Total
  column is the grand total.
- **Row and column ids are unique.** A repeated id throws in development.

### Cells

The consumer describes each body cell through one accessor,
`cell(rowId, columnId)`, which returns:

```ts
export type GridCellKind = "editable" | "summary" | "readonly";

export interface GridCell {
  kind: GridCellKind;
  /** Hours, or any number. `null` is "no value", distinct from 0. */
  value: number | null;
  /** Summary cells: visible and announced text, e.g. "2 entries". */
  badge?: string;
  /** Still editable; shown by style and by the visible `mutedLabel`. */
  muted?: boolean;
  /** Required when `muted`: e.g. "Non-working day". */
  mutedLabel?: string;
  /** Consumer validation message, e.g. "More than 24 hours on this day". */
  error?: string;
}
```

| Kind | Shows | Enter | Typing | Press |
| --- | --- | --- | --- | --- |
| `editable` | The formatted value, or nothing when `null` | Starts editing | An accepted character starts editing | Starts editing |
| `summary` | The value and the badge ("5 h · 2 entries") | Calls `onCellActivate` | Ignored | Calls `onCellActivate` |
| `readonly` | The value | Nothing | Ignored | Focuses the cell |

Row headers, row totals, column totals and the grand total are `readonly`
cells the grid derives itself. Column headers are never focusable in v1:
they carry no action (no sorting in the grid).

- **Editor.** Every editable cell edits through the Number Field logic, with
  one editor configuration for the grid (`min`, `max`, `step`, `locale`;
  Timelog: 0, 24, 0.5 and the app locale) and an optional override per
  column. Empty is `null` in the draft and in the report.
- **Value text.** `valueText(value)` turns a value into the announced text
  ("5 hours", "no hours"). Default: the formatted number, and the catalog's
  "empty" for `null`. `formatValue(value)` gives the visible text; default:
  the Number Field format for the locale.
- **Muted.** `muted` on a column (`column.muted`, `column.mutedLabel`)
  applies to every body cell of the column; `muted` on a cell applies to that
  cell. A muted cell keeps its kind: an editable muted cell stays editable.
  The muted label is visible text: in the column header for a muted column,
  inside the cell for a muted cell. The muted style (a tint or a pattern from
  tokens) adds to the text and never replaces it.
- **Errors.** Two sources, shown in the same place:
  - the editor's own validity while editing (`parse`, `range-overflow`,
    `range-underflow`, `step-mismatch`, with the Number Field messages);
  - the consumer's `error` on a body cell, and `totalError(columnId)` and
    `rowTotalError(rowId)` on derived totals (Timelog: the day's total cell
    says "More than 24 hours on this day").

  An error shows an icon and its message text; colour adds to both. The
  message is visible when the cell has focus or hover and is always part of
  the cell's description.

### Totals

- Sums skip `null`. A row or column with only `null` values totals `null`,
  shown empty and announced with the catalog's "empty".
- Sums are rounded to the largest number of decimals among their terms
  (`decimalsOf` from the Number Field), so 0.1 + 0.2 shows 0.3.
- Summary and read-only body cells count in the totals with their `value`.
- Totals recompute from the grid's committed values after every commit,
  before the commit is reported, so a handler reading the grid sees the new
  totals.
- `totals: "derived" | "none"`, default `"derived"`. With `"none"` the grid
  renders no Total column and no totals row, for a consumer that shows its
  own.

## Behaviour

Terms: the **active cell** is the one cell in the tab order. **Navigation
mode** is the default: arrow keys move between cells. **Editing mode**
applies to one editable cell: its editor has focus and arrow keys act on the
editor. **Inline-start** is the left in left-to-right text and the right in
right-to-left; **inline-end** is the opposite.

### Navigation mode

| Key | Result |
| --- | --- |
| Arrow toward inline-end, inline-start | Next or previous cell in the row. At the edge, focus stays (APG: no wrap) |
| ArrowDown, ArrowUp | Same column in the next or previous row, the totals row included. At the edge, focus stays |
| Home, End | First or last cell of the row (the row header, the row total) |
| Control+Home, Control+End | First cell of the first body row; last cell of the last row (the grand total) |
| PageDown, PageUp | Down or up by the number of body rows fully visible in the scroll area, stopping at the last or first row |
| Enter | Editable: start editing with the value selected. Summary: `onCellActivate`. Read-only: nothing |
| F2 | Editable: start editing with the caret at the end. Others: nothing |
| An accepted character | Editable: start editing with the draft replaced by that character. Others: nothing |
| Backspace, Delete | Editable: start editing with an empty draft (Enter then commits `null`). Others: nothing |
| The details shortcut | `onCellDetails` for the active cell, when the cell offers details |
| Escape | Not handled: the event continues to an enclosing dialog or page |
| Tab, Shift+Tab | Leave the grid, to the next or previous element in the tab order |

- **Accepted characters** are the locale's digits (from the Number Field
  symbol table, so Arabic-Indic digits work under `ar`), its decimal
  separator, and the minus sign when `min` is below 0. A key with Control,
  Meta or Alt held never starts editing, and a key during text composition
  (an input method) is left to the editor once it opens.
- **Only one tab stop.** Tab returns to the active cell. The first time, the
  active cell is the first editable body cell, or the first body cell when
  none is editable.
- **The active cell scrolls into view** with the nearest alignment, clear of
  the sticky headers.
- **RTL.** Column order mirrors with the text direction, and so do the arrow
  keys: in right-to-left text ArrowLeft moves toward inline-end (the next
  column). Home, End and Tab follow logical order. The direction is read
  from the platform: `dir` and the computed `direction` on the web,
  `Directionality` in Flutter.

### Editing mode

| Key | Result |
| --- | --- |
| Characters, ArrowLeft, ArrowRight, Home, End, Backspace, Delete | Edit the draft and move the caret (the editor's own keys) |
| ArrowUp, ArrowDown | Step the draft by `step`, clamped to the bounds ([question 5](#open-questions)) |
| Enter | Commit, return to navigation mode on the same cell ([question 2](#open-questions)) |
| F2 | Commit, return to navigation mode (APG: "A subsequent press of F2 restores grid navigation") |
| Escape | Revert the draft to the committed value and return to navigation mode. Consumed |
| Tab, Shift+Tab | Commit, then [question 3](#open-questions) |
| The details shortcut | Commit, then `onCellDetails` |
| Focus leaves the cell (a press elsewhere, a window switch) | Commit; the active cell stays where it was |

- **A draft that does not parse never commits.** Enter, F2, Tab and the
  details shortcut keep editing mode, and the cell shows the parse error.
  Escape still reverts. Focus leaving the grid keeps the draft as typed and
  the error visible, as the Number Field does on blur; the next focus on the
  cell resumes editing with that draft.
- **Range and step violations commit**, with the editor's error in the
  report, as the Number Field does: the value is real, and the consumer
  decides what to do with it.
- **A commit that lands on the committed value reports nothing.**
- **Escape twice.** The first Escape leaves editing mode; the second is
  unhandled in navigation mode, so a dialog around the grid closes then.

### The details action

A consumer that passes `onCellDetails` turns on a labelled secondary action
for every body cell for which `hasDetails(rowId, columnId)` returns true
(default: every editable and summary cell).

- **Visible.** A button with the catalog's "Details" label and an icon shows
  at the inline-end of the cell while the cell is active and focused, while
  it is hovered, and in editing mode. Under a coarse pointer (touch) it shows
  on the active cell.
- **Shortcut.** `detailsShortcut` is a key combination the consumer chooses
  (Timelog: Alt+Enter); the grid has no default. It works in both modes.
- **Out of the tab order.** The button is reachable by pointer, by the
  shortcut and by the screen reader's reading cursor, and keeps the grid at
  one tab stop.
- **Name.** The button's accessible name is "Details" followed by the cell's
  context ("Details, Monday 6 October, PX-12 Project X").

### Pointer and touch

- A press on an editable cell makes it active and starts editing, with the
  caret where the press landed. A press on a summary cell activates it. A
  press on a read-only cell makes it active.
- A press on the details button calls `onCellDetails` and leaves the cell's
  mode unchanged.
- Hover shows the details button and an error message; nothing else depends
  on hover.

### Focus after data changes

The active cell is held as a `{ rowId, columnId }` pair, never as indices.

- When the consumer's rows or columns change and the active pair still
  exists, the active cell stays on it.
- When the active row or column disappears, the active cell moves to the
  same position, clamped to the new size. Focus moves with it only if focus
  was inside the grid.
- A dialog opened from `onCellActivate` or `onCellDetails` returns focus to
  the cell it was opened from (ADR 0016); the cell is found by its pair, so
  a data refresh while the dialog was open keeps working.

## Accessibility

### Roles and states

| Part | Web | Flutter |
| --- | --- | --- |
| Grid | `<table role="grid">` named by `aria-labelledby` (a caption or a heading), `aria-rowcount`, `aria-colcount` | A container node labelled with the grid name ([Flutter fallback](#flutter-semantics-fallback)) |
| Column header | `<th scope="col">` (`columnheader`), `aria-colindex` | Text in each cell's label; `SemanticsRole.columnHeader` on the header node |
| Row header | `<th scope="row">` (`rowheader`), focusable | A focusable node labelled with the row label and the row total |
| Body cell | `<td role="gridcell">`, `aria-colindex`, `tabindex` 0 on the active cell and -1 on the others | One focusable node per cell, composed label |
| Read-only and summary | `aria-readonly="true"` | `readOnly: true` |
| Error | `aria-invalid="true"`, the message in `aria-describedby` | The message in the node's hint or value; `invalid` where the SDK has it |
| Muted | The muted label in `aria-describedby` | The muted label in the composed label |
| Details shortcut | `aria-keyshortcuts` on the cell; the shortcut text in the description | A custom semantics action named "Details"; the shortcut in the hint |
| Editor | The Number Field input (`role="spinbutton"`) inside the cell, labelled by the column and row headers | The Number Field's semantics, with the cell's composed label |
| Rows | `aria-rowindex` on every row, 1-based, the header row is 1 | Not applicable |

- **`aria-rowindex` and `aria-colindex` are always set**, with positions in
  the whole grid. Every row is in the DOM in v1, so they repeat what the
  table already says; they stay correct once a consumer hides columns or a
  later version virtualizes rows (APG data grid examples).
- **Header association on the web** comes from native `th` scope; the
  editor input adds `aria-labelledby` pointing at its column header and row
  header, because a focused input inside a cell does not inherit the cell's
  headers in every screen reader.
- **Focus on the cell, editor only while editing.** In navigation mode the
  cell element has focus and contains text. The editor input exists only in
  editing mode. This is the APG recommendation for a cell whose widget needs
  the arrow keys ("grid navigation keys set focus on the cell").

### Announcements

- **On focus.** The web relies on the roles: a screen reader reads the cell
  text with the row header when the row changes and the column header when
  the column changes. The cell's description adds muted label, error and the
  details shortcut. Flutter composes one label per cell (below).
- **On commit.** No announcement for the new value or the totals: the person
  just typed it. An error that appears on commit, on the cell or on a total,
  is announced once, politely (`aria-live="polite"` region owned by the grid
  on the web, `SemanticsService.sendAnnouncement` with the widget's `View` in
  Flutter), as "{column label}, {row label}: {message}".
- **Mode change.** Entering editing mode moves focus to the editor, which
  announces itself as a spin button with its value. Leaving it moves focus
  back to the cell, which reads its new value.
- What each screen reader says is a manual check, written as not yet
  verified until a dated session exists
  ([evidence register](./evidence-register.md)).

### Flutter semantics fallback

Flutter's `SemanticsRole` has `table`, `row`, `cell` and `columnHeader` and
no `grid`, `gridCell` or row header role
([SemanticsRole](https://api.flutter.dev/flutter/dart-ui/SemanticsRole.html),
[discovery](./proposals/flutter-discovery.md)). How those roles reach
VoiceOver on macOS, Narrator on Windows and Orca on Linux is unverified. So
the context each cell needs travels in its own label, and the table roles
are added as a bonus:

- **Label composition.** One focusable node per cell, with this order:
  1. the column label ("Monday 6 October");
  2. the row label ("PX-12 Project X");
  3. the value text ("5 hours", or "empty");
  4. the badge, for a summary cell ("2 entries");
  5. the muted label ("Non-working day");
  6. the error message, prefixed with the catalog's "Error".

  Example: "Monday 6 October, PX-12 Project X, 5 hours, Non-working day".
  The separator and the order come from the message catalog, so a locale can
  reorder them.
- **Totals.** A column total reads "{column label}, Total, {value}"; a row
  total "Total, {row label}, {value}"; the grand total "Total, {value}".
- **Hint.** The action the cell takes: "Edit" for editable cells, the
  consumer's activation hint for summary cells (Timelog: "Show entries"),
  plus the details shortcut.
- **Actions.** `onTap` starts editing or activates; `customSemanticsActions`
  holds a `CustomSemanticsAction(label: "Details")` when the cell offers
  details ([CustomSemanticsAction](https://api.flutter.dev/flutter/semantics/CustomSemanticsAction-class.html)).
- **Position.** No "row 3 of 12" text in v1; the labels name the row and the
  column. The A1 session decides whether positions are needed.
- **Roles.** The grid node uses `SemanticsRole.table`, each row
  `SemanticsRole.row`, each cell `SemanticsRole.cell`, and the header cells
  `SemanticsRole.columnHeader`, so a platform that maps them gains table
  navigation. The composed label is the contract; the roles add to it.
- **Editing.** The editor's own semantics (text field and spin button from
  the Number Field) carry the same composed label as the cell.

### Target size, text scale and forced colors

- **Target size.** Every cell and the details button are at least 24 by 24
  CSS pixels ([WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)),
  and 44 by 44 under `@media (pointer: coarse)` from
  `density.touch.min-target-size`. In Flutter they follow `minTargetSize`:
  24 by 24 under `compact` and `regular`, 44 by 44 under `touch` and under
  Timelog's explicit setting. A cell holding the details button is wide
  enough for the value and the button's target side by side.
- **Text scale.** Rows grow in height and columns in width with the text;
  nothing clips at 200% browser text size or Flutter text scale 2.0. The grid
  scrolls horizontally inside its own container. Two-dimensional data tables
  are an accepted exception to reflow
  ([WCAG 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)),
  and the page around the grid keeps reflowing.
- **Mode by shape.** Navigation focus draws the token focus ring around the
  cell. Editing mode draws the field border inside the cell and shows the
  caret. The two differ by shape, so colour is never the only signal.
- **Forced colors.** The focus ring and the editing border use system
  colours (`Highlight`, `CanvasText`); the error icon and the muted label
  stay visible because they are glyphs and text. In Flutter, the same rules
  apply under `MediaQuery.highContrastOf`.
- **Reduced motion.** Scrolling the active cell into view is instant under
  `prefers-reduced-motion: reduce` and `MediaQuery.disableAnimationsOf`.

## Commit semantics and callbacks

Rules from ADR 0011, applied to the grid:

- **Data is the consumer's.** Rows, columns and cells come from props. The
  grid holds the active cell, the mode, the draft and a mirror of committed
  values per cell. A later change of a cell's `value` from the consumer
  overwrites the mirror without a report (reflection never emits); an
  unchanged value leaves a local commit in place until the consumer's data
  catches up.
- **`onCellChange` once per commit, after commit.** The grid writes the
  mirror, recomputes the totals, then calls:

  ```ts
  onCellChange({
    rowId,
    columnId,
    value,          // number | null
    previousValue,  // number | null
    error,          // the editor's validity error, or null
  })
  ```

  It runs only when the value moved. A step key changes the draft and
  reports nothing ([question 5](#open-questions)).
- **Validation is the consumer's.** The grid validates what the editor
  knows (parse, range, step). Rules across cells (a day over 24 hours) run in
  the consumer's `onCellChange`, which returns the result through
  `cell().error`, `totalError` or `rowTotalError` on the next render.
- **Other callbacks.** `onCellActivate({ rowId, columnId })` for summary
  cells; `onCellDetails({ rowId, columnId })` for the details action. Each
  runs once per action.
- **Active cell.** Internal in v1, like submenu state in the menu spec. An
  `activeCell` prop and `onActiveCellChange` can be added later without a
  breaking change.
- **Form reset.** The grid holds no form value, so ADR 0012 has nothing to
  restore inside it. A form that owns the timesheet resets its own data and
  passes it in; any open draft is discarded and editing mode ends.
- **Undo.** Out of scope in v1: Escape reverts the current draft, and the
  editor's native text undo works inside editing mode. Undoing a committed
  change is the application's.

Flutter names, per ADR 0017 §2: `onCellChanged`, `onCellActivated`,
`onCellDetails`, mapped to the names above in the parity checklist.

## Layout and responsiveness

- **Scroll container.** The grid sits in a container that scrolls on both
  axes when the content is larger. The container is not a tab stop: the
  grid's single tab stop and the arrow keys move the view.
- **Sticky headers.** The column header row sticks to the block-start edge
  and the row header column to the inline-start edge, mirrored in
  right-to-left. The totals row sticks to the block-end edge when the grid
  is taller than its container (Timelog's day totals stay visible).
  Scroll padding equals the sticky sizes, so the active cell is never hidden
  under them.
- **Column widths.** Day columns share one minimum width that fits the
  widest formatted value, its badge or muted label, and the details button.
  The row header column takes a consumer width, with the name truncating
  visually and the full name in the accessible label and on hover.
- **Narrow windows.** The card view stays in the application. The grid
  exposes what the app needs to render it with the same numbers and words:
  the pure totals functions, `formatValue` and `valueText`, and the composed
  cell label from `core/src/grid`. The grid has no breakpoint of its own.
- **Tokens.** The grid reuses the Table's surface, border, header and
  density tokens; the muted tint and the error colour come from existing
  role tokens. New tokens, if any, are named by role (`--ds-grid-cell-muted`)
  and go through `docs/tokens.md`.

## Performance

- **Size.** Timelog's week is 7 day columns by a few dozen projects. The v1
  budget is 100 body rows by 31 columns (a month), about 3,100 cells, all
  rendered. Past that, the application pages its data.
- **Virtualization** is out of scope in v1: screen readers expect every row
  present (AG Grid's own accessibility guidance), and the budget above fits
  without it. `aria-rowindex` and `aria-colindex` are in place for when it
  is added.
- **Keystrokes.** Navigation is constant time per key. A draft keystroke
  re-renders the editing cell only. A commit recomputes one row total, one
  column total and the grand total.
- **Flutter.** Cells are built from the accessor on demand; editing state
  lives in the editing cell's `State`, so a keystroke rebuilds that cell.
  Rows sit in a `TwoDimensionalScrollView`-style layout or a plain
  `Table` inside two scroll views; the choice is the implementer's, measured
  against the budget above.

## Mapping per platform

### `core/`

A new `core/src/grid` module, framework-free and DOM-free in its logic, so
its key table ports to Dart as data:

```ts
export type GridMode = "navigate" | "edit";
export interface CellPos { row: number; column: number } // 0-based, header rows excluded

export interface GridShape {
  rowCount: number;      // body rows + totals row
  columnCount: number;   // row header + data columns + total column
  kindAt(pos: CellPos): GridCellKind;
  hasDetails(pos: CellPos): boolean;
}

export interface GridKey {
  key: string;           // KeyboardEvent.key values: "ArrowLeft", "Home", "F2", "5"…
  ctrl: boolean; meta: boolean; alt: boolean; shift: boolean;
  composing: boolean;
}

export interface GridKeyOptions {
  direction: "ltr" | "rtl";
  pageRows: number;      // fully visible body rows, measured by the adapter
  accepts(char: string): boolean; // the locale's digits, separator, sign
  detailsShortcut?: Omit<GridKey, "composing">;
  tabWhileEditing: "next-cell" | "leave"; // question 3
}

export type GridCommand =
  | { type: "move"; to: CellPos }
  | { type: "edit"; seed: "select" | "end" | "replace" | "clear"; text?: string }
  | { type: "commit"; then: "stay" | "next" | "previous" | "leave" }
  | { type: "cancel" }
  | { type: "activate" }
  | { type: "details"; commitFirst: boolean }
  | { type: "step"; direction: 1 | -1 }
  | { type: "none" };   // not handled: leave preventDefault uncalled

export function gridKeyCommand(
  mode: GridMode, active: CellPos, key: GridKey, shape: GridShape, options: GridKeyOptions,
): GridCommand;

export function nextEditable(from: CellPos, step: 1 | -1, shape: GridShape): CellPos | null;
export function clampActive(previous: CellPos, shape: GridShape): CellPos;
export function sumValues(values: (number | null)[]): number | null;
export function cellLabel(parts: CellLabelParts, messages: GridMessages): string;
```

- **`connect`.** Over these functions, `grid.connect(state, options)` gives
  the web prop bags: `getGridProps`, `getRowProps(rowIndex)`,
  `getCellProps(pos)`, `getEditorProps(pos)` (labelling and the editor's
  key routing), `getDetailsButtonProps(pos)` and the live region props. The
  editor itself is the existing `numberField.connect`, with its Escape and
  Enter handled by the grid while it is inside a cell.
- **Active pair.** `resolveActive(previousPair, rowIds, columnIds)` returns
  the pair to keep or the clamped one.
- **Shared test vectors** in `core/src/grid/__vectors__/`, read by
  `core/src/grid/vectors.test.ts` and by the Flutter tests:
  - `grid-keyboard.json`: a shape (kinds and details per cell), a mode, an
    active cell, a direction and a key, with the expected command;
  - `grid-totals.json`: value lists with the expected sum, `null` cases and
    decimal rounding;
  - `grid-active.json`: id lists before and after a change, with the
    expected active pair;
  - `grid-label.json`: label parts per locale with the expected composed
    label.

### Web adapters

- **Component.** A new public `DataGrid` in the table family
  ([question 1](#open-questions)): Svelte `DataGrid.svelte` with
  `createDataGrid` (the reference), Vue `DataGrid`, custom element
  `ds-data-grid`, React `DataGrid`. It shares `TableColumnDef`-style column
  definitions where the fields mean the same thing (`key` as `id`, `label`,
  `align`), and the Table's styles. Table, Table View and Table Set keep
  native table semantics and are unchanged.
- **Props (web names).** `columns`, `rows`, `cell`, `editor`
  (`{ min, max, step, locale }`), `formatValue`, `valueText`, `totals`,
  `totalError`, `rowTotalError`, `hasDetails`, `detailsShortcut`,
  `onCellChange`, `onCellActivate`, `onCellDetails`, `label` or
  `labelledBy`, and the message overrides through `LocaleProvider`.
- **Events.** Key handling lives on the grid element, delegated to cells;
  the adapter maps `KeyboardEvent` to `GridKey`, calls `gridKeyCommand` and
  applies the command (focus, editor mount, commit, callback).
- **Measurement.** `pageRows` comes from the scroll container's height and
  the row height at the time of the key.

### Flutter

- **Widget.** `DataGrid` in `packages/flutter/lib/src/data_grid`, with the
  constructor arguments above in Dart names (`onCellChanged`,
  `onCellActivated`, `onCellDetails`). Controlled only: the data always
  comes from the consumer, so no `.uncontrolled` constructor.
- **Focus.** One `FocusNode` per mounted cell inside a
  `FocusTraversalGroup`; the grid tracks the active pair and gives the
  active cell's node `skipTraversal: false` and every other cell
  `skipTraversal: true`, so Tab sees one stop (the roving pattern already in
  `lib/src/internal/roving.dart`).
- **Keyboard.** `Shortcuts` maps key events to grid intents, and one
  `Actions` handler asks the Dart port of `gridKeyCommand`, which reads the
  same vectors. `Directionality.of(context)` gives the direction. A command
  of type `none` leaves the key unhandled (`KeyEventResult.ignored`), so an
  enclosing dialog receives Escape.
- **Editor.** The existing `NumberField` logic (`lib/src/number_field`)
  inside the editing cell, with the grid's intents taking Enter, Escape and
  Tab before the field.
- **Semantics.** As in the [fallback](#flutter-semantics-fallback);
  announcements through `lib/src/internal/announce.dart`.
- **Scrolling.** `Scrollable.ensureVisible` for the active cell, with the
  sticky header sizes as padding.

## Test plan

### Shared vectors

The four files above. A changed vector fails the core and the Flutter tests
together (ADR 0017 §1).

### Unit tests (`core/`)

- Every row of both keyboard tables, in both directions, for each cell kind.
- Edges: no wrap at row and column ends; Control+End lands on the grand
  total; PageDown stops at the last row.
- Accepted characters per locale (Latin, Arabic-Indic digits), modifiers and
  composition refused.
- Totals: `null` handling, rounding, `totals: "none"`.
- `resolveActive` for removed rows, removed columns and reordered ids.
- Props: `role`, indices, `aria-readonly`, `aria-invalid`,
  `aria-describedby`, `aria-keyshortcuts`, one `tabindex="0"`.

### Adapter interaction tests (Svelte first, then Vue, custom elements, React)

- Single tab stop; Tab out in navigation mode; Tab while editing as decided.
- Enter, F2, a digit, Backspace start editing with the right draft; Escape
  reverts and a second Escape reaches a surrounding dialog.
- `onCellChange` once per commit, after commit, with totals already updated;
  silent when the value is unchanged; never on reflection of a new `cell`
  value.
- A parse error keeps editing mode and commits nothing; a range error
  commits with `error` set.
- Summary cell: Enter and press call `onCellActivate` once; typing does
  nothing.
- Details: button visible on focus and hover, the shortcut works in both
  modes, the accessible name carries the context.
- Muted cells stay editable and expose their label; consumer errors appear
  and are announced once.
- Focus returns to the cell after a dialog opened from it closes, after a
  data refresh.

### End-to-end scenarios (Playwright, three engines)

- A full keyboard week entry in left-to-right and right-to-left pages.
- Sticky headers and totals with the active cell scrolled into view at 320
  pixels wide and at 200% text size.
- Target size 24 by 24, and 44 by 44 under an emulated coarse pointer.
- Forced colors: focus ring, editing border, error and muted text visible.
- Axe over the catalog demo.

### Flutter widget tests

- The shared vectors.
- Keyboard paths with `sendKeyEvent` under `TextDirection.ltr` and `rtl`.
- Semantics with `matchesSemantics`: composed label per cell kind, read-only,
  hint, the "Details" custom action.
- Announcement of a new error once, through the announce helper.
- `meetsGuideline` with 24 by 24 and 44 by 44 `MinimumTapTargetGuideline`,
  `labeledTapTargetGuideline`, `textContrastGuideline`; text scale 2.0
  without clipping.
- The callback order: setState, totals, then `onCellChanged`, once.

### Parity checklist lines

For `packages/flutter/parity/data-grid.md`: each cell kind; muted per cell
and per column; each error source; each row of both keyboard tables; RTL
mirroring; single tab stop; accepted characters per locale; parse and range
commit rules; Escape consumption; the details button, shortcut and
semantics action; label composition and its order per locale; totals and
rounding; active cell after data changes; focus return after a dialog;
target size per density; text scale; high contrast; the callback names
mapped to ADR 0011.

## Open questions

1. **Which component carries the grid?** Recommendation: a new public
   `DataGrid` in the table family. Table View is internal and built around
   native table semantics, pagination and the card view; adding grid
   navigation and editing there changes the semantics of every existing
   table. A separate component keeps those tables as they are and shares
   column definitions and styles. ADR 0017 §6 says "the web Data Table
   gains it"; this reads it as the Data Table family.
2. **Enter after a commit: stay or move down?** Recommendation: stay on the
   cell, in navigation mode. It is APG's first option, it keeps Enter
   symmetric with entering editing mode, and Tab already gives fast entry
   along a row.
3. **Tab while editing.** Recommendation: commit and edit the next editable
   cell in reading order (Shift+Tab the previous), skipping summary and
   read-only cells; after the last editable cell, commit and leave the grid.
   This is spreadsheet and AG Grid behaviour, and it fits filling a week.
   The alternative, commit and leave the grid, is simpler and matches
   navigation mode.
4. **Where the row total sits.** Recommendation: a trailing Total column
   with its own header. It gets a column header, so the total announces as
   "Total, PX-12 Project X, 36 hours", and the row header name stays short.
   Timelog's layout shows it inside the row header; the grid can draw it
   there visually only if the maintainer prefers, at the cost of a longer row
   header name read on every row change.
5. **ArrowUp and ArrowDown in the editor.** Recommendation: they step the
   draft and commit with the rest of the edit, so one edit gives one
   `onCellChange` and Escape undoes the steps too. This differs from the
   standalone Number Field, where each step commits, and is recorded as a
   grid rule in both adapters.
6. **Undo of committed changes.** Recommendation: out of scope for the
   component in v1. An application that wants it keeps a history of
   `onCellChange` reports and offers its own Undo; a grid-level Control+Z
   can be specified later from that experience.
