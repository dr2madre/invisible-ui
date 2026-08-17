# Data Table: executable specification

The table work, in three independently reviewable units with hard stop
boundaries. Written against the code as it is on 17 August 2026 and against the
findings in [state-ownership-audit.md](./state-ownership-audit.md). It is a
specification, not an implementation: nothing here has been built.

Fixed scope for all three units: Table View stays internal in both adapters;
Svelte and Vue move together; the output stays a native table or the existing
card view. No `role="grid"`, no cell navigation, no editing, no
virtualization, no data fetching, no caching, no query-library integration.

## What exists

- `core/src/table` owns the active **sort** and the **hidden columns**, and
  exposes `sortRows` and `isColumnVisible`. The primitive Table's `sort` prop
  is controlled.
- `Table` renders the semantic table with `aria-sort`. Public in Svelte and Vue.
- `TableView` adds pagination (`page`, `pageSize`, `onPageChange`), infinite
  loading and the table/card view. Internal in both adapters; consumers reach
  it through `TableSet`, using one view for the single-view shell.
- `TableSet` adds the view list, the active view and per-view coordination.
  Public in Svelte and Vue.

## Task 5A — Repair existing controlled contracts

No selection or filtering feature enters this unit. Its job is to make the
existing public prop descriptions true.

Verified defects (17 August 2026). Two kinds of evidence back them: rerender
probes (temporary tests, run and removed) and code inspection. The permanent
rerender tests for every prop arrive in this unit.

- Confirmed by probe: Svelte `sort`, `page` and `activeView` do not follow a
  later prop change; Vue `sort` and `activeView` do not; Vue `hiddenColumns`
  **does** follow.
- Confirmed by inspection: Svelte `TableView` seeds `sort` and `hiddenColumns`
  through the `createTable` context literal, which has no mirroring path, and
  seeds the table/card view locally; Vue `TableView` seeds `page` with
  `ref(props.page)` and no watch, and the table/card view the same way; both
  `TableSet`s seed the view definitions at initialization.
- The one asymmetry: Vue `useTable` watches `sort` and `hiddenColumns`, which
  is why Vue `hiddenColumns` follows; `TableView` however passes a `sort`
  computed once into the options getter, so a later `sort` prop never reaches
  that watch (probe).
- `TableSet`'s `activeView` docstring says "(controlled)", which overstates the
  contract.

Required synchronization, in Svelte and Vue, without remounting: `activeView`;
`views` and their columns and rows; `page`; `view` (`table` or `card`);
`sort`; `hiddenColumns`.

Use the repository's controllable-mirror convention, not new `defaultX` props:

- a user action updates the local rendered state immediately and calls the
  existing callback once;
- a later change of the corresponding prop value, or of the array or object
  reference, overwrites the local mirror;
- an unchanged prop does not reset a local interaction during an unrelated
  rerender;
- reflecting a prop never calls the consumer's change callback.

Preserve existing defaults. No reactive feedback loops, no duplicate callback
calls. When an externally supplied active view disappears, choose the first
remaining view; when no views remain, render the single-view input. When the
page count shrinks below the current page, clamp once, and report the change
through the existing callback only when the component itself changed the page
as a consequence of the data or page-count change.

Do not change: the two-state sort toggle in Table View, the three-state
primitive Table cycle, the default sort selection, the infinite-loading
contract, the card rendering.

Tests, rerender-based, in both adapters, for every prop above:

- no remount;
- no callback during prop reflection;
- exactly one callback per user action;
- the disappearing active view;
- page clamping after the rows shrink;
- Svelte and Vue parity of outcomes.

Update the misleading `controlled` docstrings only after these tests pass.

**Stop after Task 5A.** Selection work does not begin in the same unreviewed
unit.

## Task 5B — Row-selection state and native table composition

Starts only from an accepted Task 5A.

Shared types:

```ts
export type RowId = string | number;
export type SelectionMode = "none" | "single" | "multiple";
```

Headless table state, controlled selection:

- `selectionMode`, default `"none"`, so current markup is unchanged;
- `selectedRowIds: RowId[]`, default empty;
- `onSelectedRowIdsChange`;
- pure operations to select, deselect, toggle, clear and query a row;
- pure operations to derive and toggle selection for an explicit scope of row
  ids;
- support for rows that are not selectable.

Rules:

- selected ids stay unique, ordered by the order in which they were selected;
- single mode replaces the previous selection; none mode makes every selection
  operation a no-op;
- selection is controlled data: it is never silently cleared by a page,
  filter, sort, view or row-order change. A selected id absent from the
  current rows is **retained** until the consumer changes `selectedRowIds`,
  which is what server pagination needs. This rule is documented.

Header select-all:

- its scope is the **selectable rows currently rendered on the page**, never
  the whole remote dataset, and its accessible name states that scope;
- when not all of the scope is selected, toggling selects every selectable id
  in the scope; when all are selected, toggling removes only that scope;
- ids outside the scope are preserved either way;
- the checkbox exposes native `checked` and `indeterminate` state.

Adapter markup, Svelte and Vue together:

- `selectionMode !== "none"` adds a leading selection column in table view and
  an equivalent control in card view, built on the existing Checkbox primitive
  and native table semantics;
- the row itself never becomes a checkbox, a button or a clickable surface; no
  row-click selection;
- each row checkbox takes its accessible name from one required consumer
  callback or column definition, defined once and used by both adapters, never
  from serialized row objects;
- stable ids are **required** when selection is enabled: the index fallback of
  `getRowId` is removed for selection, and a missing stable id fails in
  development with an actionable message. The index fallback survives only for
  non-selectable presentation.

Tests: core transitions (modes, uniqueness and order, non-selectable rows,
page-scope select-all and mixed state, ids outside the visible page) and
adapter tests (controlled rerender, table and card parity, native checkbox and
table semantics, accessible names, selection after sorting and paging, no
index-based persistent selection). Browser tests for the indeterminate DOM
state, focus after paging, keyboard activation, 320 pixel reflow and card
view, and RTL; a jsdom assertion alone does not count for indeterminate or
focus.

**Stop after Task 5B.**

## Task 5C — Filtering composition and coordination

Starts only from an accepted Task 5B.

Filtering predicates, structured filter schemas, remote requests, query-text
persistence and authorization remain **application state**. No opaque business
filter enters `core/TableState`, and no core predicate such as `filterRow` is
introduced.

The consumer's filter controls live in the existing Table Set `toolbar`
region. Table Set gains only the coordination inputs the pattern needs:

- whether filters are active;
- the total unfiltered row count, when known;
- the **already-filtered rows** supplied by the consumer;
- an optional clear-filters callback;
- accessible copy for the no-results state.

Distinguished states:

- zero total rows: the dataset is empty;
- total rows above zero, zero supplied rows, filters active: no results;
- rows present: content;
- loading, refreshing and error stay outside this unit (Task 6).

Page reset: the application owns the filter values; Table Set resets its local
page to one only when the active-filter signal or the explicit
`filterRevision: string | number` input changes. No comparison of filter
objects or row-array identity. The reset never clears the selection, happens
immediately, calls the existing page callback exactly once, and a later `page`
prop change overwrites the mirror under Task 5A's convention.

No built-in search field, no generic predicate, no structured-filter schema,
no live region around the whole table. The no-results state composes Empty
State and a clear-filters action with ordinary status semantics.

Tests: Svelte and Vue parity tests plus browser tests for empty versus
no-results, the page reset, selection preservation, focus after clearing
filters, and non-noisy announcements.

## Final report, per accepted unit

State ownership, public API changes, backwards compatibility, adapter parity,
automated checks, manual checks, and the Data Grid capabilities deliberately
deferred. The backlog is updated only after the implemented unit is accepted.
