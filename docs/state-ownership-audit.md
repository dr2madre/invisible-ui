# State ownership audit

Where the state of each shipped pattern and each backlog candidate actually
lives, checked against the source on 17 August 2026, not against the planning
documents. It exists to decide what the next tasks should build, and what they
should deliberately leave to the application.

The ownership test: a state belongs to the design system only when it is needed
to preserve reusable semantics, interaction, accessibility or consistent
behaviour across consumers. Domain state stays in the application. An
application-owned state is not a gap.

## Matrix

### Dialog workflow composition

- **Primitives**: Dialog, Button, and whatever the application puts in the
  regions.
- **`core/`**: open state, the ARIA wiring of trigger, panel, title and
  description, Escape.
- **Adapters**: the native `<dialog>` concerns (modality, scroll lock, backdrop
  dismissal, focus in and focus return), the header, body and footer layout, and
  the `headerMeta`, `footerLead`, `footer` regions with `bodyLayout`.
- **Documentation demo only**: the two-step example's step index and its focus
  move on a step change.
- **Application**: step index, step content, labels, the focus destination on a
  step change, and any side effect a step applies.
- **Genuinely missing**: nothing for the dialog itself. The recurring cost is
  the workflow coordination described under Form workflow below.
- **Controlled / uncontrolled**: `open` is controlled with `onOpenChange`; Vue
  adds `v-model:open`.
- **Parity and coverage**: Svelte, Vue, React and Elements carry the regions;
  Reflex exposes them as component-valued props. Unit tests in four adapters,
  browser tests for focus, scrolling, 320 pixels and right-to-left.

### Stepper and compact workflow context

- **Primitives**: Stepper; for the compact case, plain text in a metadata
  region.
- **`core/`**: current index, count, linear gating, per-step status, the
  reachability rule.
- **Adapters**: the `<nav>` and `<ol>` markup, `aria-current`, the visually
  hidden completed wording, styling hooks.
- **Application**: what a step means, whether it may be entered, and the
  content of each step.
- **Known limitation, not scheduled**: every step is a `<button>`, so a purely
  informational stepper cannot be expressed. Recorded for the maintainer; no
  API is being added, and flows that only report a position use the compact
  contextual text instead.
- **Controlled / uncontrolled**: `current` with `onStepChange`, controlled.
- **Parity and coverage**: Svelte and Vue only, and extending it to the other
  adapters is not scheduled. Unit tests in both adapters, plus browser tests
  for wrapping labels, a 320 pixel viewport, right-to-left and focus
  visibility.

### Login Form and form validation

- **Primitives**: Field, TextField, Button, InlineNotification.
- **`core/`**: field semantics only, that is `required`, `invalid`, `disabled`
  and the label, description and error relationships.
- **Adapters**: Login Form owns its email and password values internally and
  reports `onSubmit`.
- **Application**: everything else, including validation, submission,
  authentication and error recovery.
- **Genuinely missing**, and confirmed by a real sign-in flow: controlled
  values, `touched` and `dirty`, synchronous and asynchronous validation with a
  `validating` state, form-level errors, the submission cycle (idle,
  submitting, succeeded, failed), duplicate-submission guarding that keeps the
  entered content available, focus movement to the first invalid field or to an
  error summary, and the predicate that decides whether a workflow may advance.
- **Candidate owner, not approved**: a headless, framework-neutral form
  controller, most likely in `core/`, with Field staying a semantic renderer.
  What is settled is only the negative: not Field, which must not become a
  schema framework, and not Dialog, which must not learn about steps. Whether
  the controller is built at all, and where it lives, is a maintainer decision.
- **Controlled / uncontrolled**: Login Form is uncontrolled today and has no
  pending, disabled, field-error or form-error inputs.
- **Parity and coverage**: Login Form ships in Svelte and Vue. Field ships
  broadly. Unit tests cover the semantics, not a submission cycle.

### Table, Table View and Table Set

- **`core/`**: **sorting** (active column and direction) and **column
  visibility**. The claim that Table is purely presentational is stale.
- **Adapters**: Table renders the semantic table and `aria-sort`; **Table
  View** adds pagination (`page`, `pageSize`, `onPageChange`) and infinite
  loading (`infinite`, `hasMore`, `loading`, `onLoadMore`); **Table Set** adds
  the view list, the active view and per-view coordination.
- **Application**: the rows, the data fetching, and the meaning of a view.
- **Parity**: **Svelte and Vue both ship all three.** `Table` and `TableSet`
  are public in both; `TableView` is **internal in both** and is reached
  through `TableSet`.
- **Genuinely missing**: row selection, filtering, and the coordination of
  sort, filter, selection and pagination as one machine over a data source.

**Controlled contracts are broken today in Table View and Table Set.** The
**primitive Table's `sort` prop is controlled** and is not affected. Verified
on 17 August 2026, by rerender probes (temporary tests, run and removed) where
marked, and by code inspection otherwise:

| Prop (Table View / Table Set) | Svelte | Vue |
| --- | --- | --- |
| `sort` | not followed (probe) | not followed (probe) |
| `hiddenColumns` | not followed (inspection: seeded through the context literal, no mirroring path) | **followed** (probe) |
| `page` | not followed (probe) | not followed (inspection: `ref(props.page)`, no watch) |
| `activeView` | not followed (probe) | not followed (probe) |

The causes are in the source, not in the tests:

- Svelte `TableView` seeds `sort`, `hiddenColumns`, `page` and the table/card
  `view` into local state once (the first two through the `createTable`
  context literal) and never mirrors later prop changes.
- Svelte `TableSet` seeds `activeView` and the view definitions at
  initialization.
- Vue `TableView` seeds `page` and the table/card `view` locally. Its
  `useTable` **does** watch `sort` and `hiddenColumns`, so `hiddenColumns`
  follows; `TableView` however computes `initialSort` once and passes that
  constant into the options getter, so a later `sort` prop never reaches the
  watch.
- Vue `TableSet` seeds `activeView` and the view definitions during setup.
- `TableSet`'s `activeView` docstring says "(controlled)", which overstates the
  contract.

These are **existing contract defects and their repair is Task 5A**, recorded
here and deliberately not fixed in this audit.

### Async Content

- **Primitives**: Loading, Skeleton, Empty State, Error State, and the content
  itself.
- **Owned today**: nothing. There is no Async Content implementation in any
  adapter.
- **Application**: the query, its cache, its authorization and its retry.
- **Genuinely missing**: the **orchestration** only, that is which state is
  shown when, so that an empty state never appears while a query is running and
  a slow query does not flash a loader.
- **Candidate owner, not approved**: a small headless state machine, most
  likely in `core/`, fed by application-owned flags. The data never enters the
  design system.

### Multi-select with tags

- **Primitives**: Combobox, Tag.
- **`core/`**: the combobox owns a **single** `value: string | null`.
- **Genuinely missing**: multi-value selection state, that is the selected set,
  add and remove, duplicate rules, the keyboard contract for removing the last
  tag with Backspace, and the relationship between the input text and the
  committed values.
- **Candidate owner, not approved**: `core/`, as a multi-value mode of the
  combobox state or a sibling state module. This is a real design round, not a
  styling exercise.
- **Parity and coverage**: none, since nothing is implemented.

### Search Dialog

- **Primitives**: Dialog plus Combobox.
- **Owned today**: the composition ships in Svelte and Vue, with its own
  `create-search-dialog` seam over the combobox core.
- **Application**: the searchable items and what selecting one does.
- **Genuinely missing**: nothing found. No reproducible defect surfaced in this
  audit, so it stays recorded as covered.

### Notification Center

- **What it is**: a documented **pattern**, not a component, and distinct from
  Notification, Notification Region and `createNotifier`, which are the toast
  machinery. The pattern composes Button and Count (the trigger with its unread
  badge), Sheet Dialog (the panel), TextField (the search), Toggle Group with
  Toggle Button (the filters), Inline Notification (each entry) and Switch (the
  per-topic preferences).
- **Owned today**: nothing beyond those primitives. Each one owns its own
  semantics and interaction; the pattern is the arrangement, shown in the
  documentation demos.
- **Application, intentionally**: the history, the read and unread state, the
  filters' meaning, the topic taxonomy and any persistence. These are domain
  state and are **not** a missing primitive.
- **Genuinely missing**: nothing at the primitive level.

### Sidebar

- **Primitives**: navigation markup, Collapsible, Sheet Dialog on small
  viewports.
- **Owned today**: nothing; the pattern is not implemented.
- **Application, certainly**: the active destination and the routing. Menu,
  Collapsible and Sheet Dialog must not own either.
- **Still to decide, at the pattern level**: the desktop and mobile
  presentation, and the collapse and open coordination. Both are pattern-design
  decisions, not preassigned to the application.
- **Genuinely missing**: only the documented composition, not new state.

## Documentation drift found

- `docs/component-backlog.md` described Table as "presentational by design",
  which contradicts `core/src/table` (sorting and column visibility) and the
  shipped Table View and Table Set. Corrected in that file.
- The same row listed pagination and view switching as future Data Table work,
  although both ship today. Corrected to name the work that actually remains.
- `docs/component-inventory.md` already records Table View as internal and not
  exported, which matches `packages/svelte/package.json`. No change needed.
- No contradiction was found between the ADRs, the technical roadmap and the
  source for the components audited here.

## Briefs for the next tasks

These are plans, not work. None of them is implemented.

### Task 5 brief — Data Table

Superseded by the full specification in
[data-table-spec.md](./data-table-spec.md), which fixes the contract in three
units with hard stop boundaries:

- **5A** repairs the controlled contracts above (the controllable-mirror
  convention, rerender tests per prop and per adapter, no callback on prop
  reflection);
- **5B** adds controlled row selection (`RowId = string | number`,
  `selectedRowIds` with `onSelectedRowIdsChange`, page-scoped select-all,
  stable ids required when selection is enabled, retained off-page ids);
- **5C** adds filtering composition (already-filtered rows from the consumer,
  an explicit `filterRevision`, no core predicate, page reset that never
  clears selection).

Svelte and Vue move together; Table View stays internal; the maintainer
decisions on these points are closed.

### Task 6 brief — Async Content

- **Existing**: Loading, Skeleton, Empty State, Error State, and the delay
  handling already inside Loading.
- **Missing, confirmed**: the orchestration deciding which of them is visible.
- **Owner**: a headless state machine in `core/`, driven by application flags.
  It must never hold the data, the cache or the authorization.
- **Candidate API**: a state derived from `status` (`idle`, `loading`,
  `success`, `error`), `isEmpty` and a no-flash delay, exposing `view`
  (`idle`, `loading`, `content`, `empty`, `error`) plus prop getters for the
  live region and the retry action.
- **Adapters**: core plus Svelte first; Vue and React follow.
- **Compatibility risks**: none, since nothing exists yet; the risk is scope
  creep into data fetching.
- **Tests**: unit tests for the transition table, including empty-while-loading
  and the delay; a browser test that a slow query does not flash a loader and
  that focus and announcements behave on retry.
- **For the maintainer**: whether the empty state is decided by the consumer's
  `isEmpty` flag or inferred, and whether retry belongs to the machine.

### Task 7 brief — Multi-select with tags

- **Existing**: single-value combobox state in `core/`, and Tag for display.
- **Missing, confirmed**: the multi-value state and its keyboard contract.
- **Owner**: `core/`.
- **Candidate API**: `values: string[]` with `onValuesChange`, `max`, a
  duplicate rule, `removeValue`, and prop getters for each tag's remove
  control. The decision to record first is whether this is a `multiple` mode of
  Combobox or a sibling component.
- **Adapters**: core plus Svelte first, then Vue; React and Elements ship a
  Combobox too, so their parity has to be planned.
- **Compatibility risks**: a `multiple` mode changes the meaning of `value` on
  an existing public component; the hidden form input needs a defined
  serialisation; `aria-activedescendant` and the tag list must not create two
  competing focus stories.
- **Tests**: unit tests for add, remove, duplicates and the maximum; browser
  tests for Backspace removing the last tag, for the announcement of a removal,
  and for the focus destination after removing a tag.
- **For the maintainer**: `multiple` mode versus a separate component, and the
  form serialisation format.

## Maintainer decisions, closed

The questions this audit raised have been decided:

1. A form controller in `core/` stays a **candidate needing its own design
   round**; no controller is implemented and Login Form is not expanded in
   Tasks 1 to 7.
2. No non-interactive Stepper mode is added in this work.
3. Stepper is not ported to React, Elements or Reflex in this work.
4. Table View stays internal; consumers use Table Set with one view for the
   single-view shell.
5. Future Table Set work is implemented in Svelte and Vue together, and the
   controlled-contract repair is Task 5A of
   [data-table-spec.md](./data-table-spec.md).
