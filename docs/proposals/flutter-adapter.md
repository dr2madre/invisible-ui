# Proposal: Flutter adapter for Invisible UI (`packages/flutter`)

## What changed since the previous request

- **The ADR is yours.** The Invisible UI team writes and accepts the ADR for the Flutter adapter.
  No adapter code is written before it is accepted. The section "Input for the ADR" below
  is a proposal, not a decision.
- **Who writes the code.** After the ADR is accepted, the Timelog team contributes components
  **only inside `packages/flutter`**, following this repository's rules: AGENTS.md,
  CONTRIBUTING.md, branch-first workflow, commit conventions, human review and ownership of every
  change. Nothing outside `packages/flutter` is touched by Timelog. Changes elsewhere (docs,
  CI, token sources, ADRs) are requested from you.
- **Two consumers.** Timelog and Wireframe (both Flutter desktop apps) will use the package.
  Wireframe will replace its own token generator and chrome widgets with it.
- **How consumers pin it.** A git dependency pinned to a commit
  (`git: url, path: packages/flutter, ref: <commit>`). A local `dependency_overrides` path is used
  only while a component and its consumer screen are developed together, and is never committed.
  So the package must work standalone from a git checkout: no workspace-only path dependencies.

## Context

Nimble Timelog is a Flutter desktop app (macOS, Windows, Linux) for tracking hours per project:
local-first, with Italian, English and Arabic (RTL) UI. It will move its whole UI onto Invisible
UI. `core/` is DOM-based and cannot run in Flutter, so this needs an adapter that
**reimplements component behaviour in Dart**, faithful to the Invisible UI spec.

Timelog migrates one component at a time: each component replaces its counterpart everywhere in
the app as soon as it ships. The order of the component list below is the order in which Timelog
is blocked.

## Input for the ADR

The adapter departs from two current rules: "adapters stay thin, shared behaviour stays in
`core/`" (AGENTS.md) and "Flutter: tokens only" (`docs/next-adapter-strategy.md`). The ADR
should settle, at least:

| Topic | Proposal from Timelog |
|---|---|
| Parity without `core/` | Component specs remain the source of truth. Each Flutter component ships a parity checklist against its Svelte counterpart (states, variants, keyboard map, semantics) plus behaviour test cases written from the spec. |
| State and callbacks (ADR-0011) | Same model in Dart: controlled and uncontrolled values, `onValueChange`-style callbacks, same prop names where Dart allows. |
| ARIA → Flutter | Roles and states map to `Semantics`. Keyboard maps to `Shortcuts`/`Actions` and `FocusableActionDetector`. Live regions map to `SemanticsService.announce`. Focus management follows the same APG pattern as the web component. |
| Dependencies | `package:flutter/widgets.dart` only. No Material or Cupertino: consumers can set `uses-material-design: false`. No bundled icon font: icons are passed as `Widget`s. |
| Tokens | Generated inside the repo from `packages/svelte/tokens/tokens.json`, with a CI check that fails when stale. |
| Versions | Flutter stable; Dart SDK constraint `^3.8.0` (Timelog's current constraint; Wireframe is on `^3.12.0`). |
| Scope | Components are ported on demand, never app-specific. Missing web components (e.g. the editable grid) are specified once for all platforms. |
| Docs | Where Flutter components are documented (docs site, or a README per component). |

## How to build it (once the ADR is accepted)

**Package**
- `packages/flutter`, Dart package name `invisible_ui`, MIT.
- No app strings, data or logic.

**Tokens and theme**
- Dart tokens generated from `tokens.json`: palette, style tier, radius, spacing, typography,
  focus ring, in light and dark.
- An `InvisibleTheme` (InheritedWidget) that consumers override partially (colours, density,
  radius) without forking components, as `--ds-*` variables work on the web.
- Font family and density are set by the consumer. Timelog uses the system font; Wireframe uses a
  compact desktop density.

**i18n and RTL**
- Every built-in string (close, clear, previous/next month, "n selected", validation messages)
  comes from a messages object with English defaults, overridable by the consumer (equivalent of
  `LocaleProvider`). Timelog supplies Italian and Arabic.
- Directional APIs only (`EdgeInsetsDirectional`, `AlignmentDirectional`…). Directional icons and
  arrow keys are mirrored under `TextDirection.rtl`.
- Numbers and dates are formatted and parsed with a locale passed by the consumer.

**Accessibility (definition of done for every component)**
- Fully keyboard-operable following the APG pattern of the Svelte counterpart. Esc closes
  overlays and focus returns to the trigger.
- Visible focus ring from tokens, never removed.
- Accessible name on every control. Label, description and error are associated with the control
  in `Semantics`.
- State (selected, invalid, disabled, expanded) is never shown by colour alone.
- Hit targets of at least 44×44 logical px, as a minimum that grows with content. Works at text
  scale 2.0 without clipping.
- Widget tests for keyboard paths, semantics, RTL, text scale 2.0, and `meetsGuideline`
  (`labeledTapTargetGuideline`, `androidTapTargetGuideline`, `textContrastGuideline`).

## Components, in the order Timelog needs them

### Wave 1 — foundations

| Component | Timelog needs |
|---|---|
| Tokens + `InvisibleTheme` | Light first, dark after. |
| Focus ring | Shared by all components. |
| `Button` | Variants primary, secondary, ghost, danger; leading icon + label; `loading`; disabled. (Timelog itself never uses icon-only buttons.) |
| `Field` | External label, description, error; associated with the control. |
| `TextField`, `Textarea` | Textarea with min/max lines (Timelog: 3–6). |
| `NumberField` | Decimal hours: locale decimal separator, `min` 0, `max` 24, `step` 0.5, **empty distinct from 0 in the API**, parse and range errors exposed. |
| `Card` | Container with optional header. |
| `EmptyState`, `ErrorState`, `Loading` | Icon + title + text + optional action. |
| `Notification` (toast), `InlineNotification` | Success and error with icon and text, announced, dismissible, reduced motion. |

### Wave 2 — forms, lists, dialogs

| Component | Timelog needs |
|---|---|
| `ConfirmDialog`, `AlertDialog`, `Dialog` | Destructive confirmation with a consequence sentence and outcome-named buttons ("Keep hours" / "Delete"). Plain dialog for About and Export. Focus trap, Esc, return focus. |
| `Select` | Status, language, date format, number format, currency. |
| `Combobox` (searchable) | Project picker; client picker (optional, clearable). |
| `SegmentedControl` | All / Active / Archived; Summary / Enter hours; Month / Year / All / Range. |
| `CheckboxGroup`, `Checkbox` | Working days (may be empty). |
| `Switch` | Autosave. |
| `RadioGroup` | Export scope: month / year / all / filtered view. |
| `DatePicker` | Gregorian values, calendar popover, `weekStartsOn` from the consumer, localized names, keyboard navigation, clearable. |
| `Popover` | Cascading region picker with search. |
| `DropdownMenu` / `Menu` | Import / Export menu. |
| Navigation bar | 5 sections with icon + label, current section exposed to assistive tech. Which Invisible UI pattern fits (`NavigationMenu`, `Tabs`, `Sidebar`), or is a new one needed? |
| `Tooltip` | Supplementary text only. |

### Wave 3 — data

| Component | Timelog needs |
|---|---|
| `Table` | Read-only lists and summaries, row activation. |
| **Editable grid** (new, also missing on the web) | The weekly timesheet, see below. |

### Editable grid — requirements for the cross-platform spec

- Rows = projects (row header: code, name, row total). Columns = 7 days (header: day, month,
  weekday). A totals row per day.
- APG grid keyboard model: arrows between cells, Home/End, Ctrl+Home/End, Enter or F2 to edit,
  Esc to cancel, Tab leaves the grid. Row and column headers announced on focus.
- Editable cells host a `NumberField` (empty = no value).
- **Summary cell state:** shows a value and a text badge ("5 h · 2 entries"), not directly
  editable. Enter triggers a consumer callback.
- **Labelled secondary action per cell** ("Details"), visible on focus or hover, bound to a
  consumer-defined shortcut (Timelog: Alt+Enter) and announced.
- **Muted state** per cell and column (non-working days): still editable, conveyed by style and
  text, not colour alone.
- Per-cell error state with message (a day over 24 hours).
- RTL: column order and arrow keys mirror.
- The narrow-window fallback (cards) stays in the app.

## Out of scope for Timelog

Carousel, tree view, range slider, pin input, meter, stepper, context menu, menubar.

## Working together

1. You write and accept the ADR. Timelog waits.
2. Timelog opens one request per component, in the order above, naming the screen it unblocks.
3. Timelog implements it on a branch inside `packages/flutter`, with tests and the parity
   checklist. You review and own the merge.
4. Timelog bumps its pinned commit. Bugs and missing states come back as issues against the
   adapter, never as forks or patches inside Timelog.
