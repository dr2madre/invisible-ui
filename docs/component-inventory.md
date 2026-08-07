# Component inventory — spec names & nativeness (internal)

Every styled component, audited from the source (doc comments, rendered markup
and the `role:` values the core emits). Three questions per row:

- **Spec name** — what the W3C calls it: a [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/)
  pattern, an ARIA role, or a plain HTML element.
- **Type** — where the behaviour comes from:
  `native` (a native HTML element owns it) · `hybrid` (native element + scripted
  ARIA on top) · `ARIA` (custom element, scripted pattern) · `presentational`
  (no interactive behaviour).
- **≠** — marked when *our* name diverges from the spec name (the naming-map
  page explains the public-facing aliases; this column is about the spec).

Every component ships with `vitest-axe` coverage; form participation is listed
because it is part of the native-first stance (ADR 0003/0005).

| Component | Spec / W3C name | Type | Form | ≠ | Notes |
| --- | --- | --- | --- | --- | --- |
| Accordion | APG Accordion | ARIA | — | | |
| Alert Dialog | ARIA `alertdialog` on `<dialog>` | native | — | | The `alert()` job (ADR 0005). |
| Aspect Ratio | CSS `aspect-ratio` | presentational | — | | Explicitly no role. |
| Avatar | ARIA `role="img"` | ARIA | — | | Labelled image either way (image or initials). |
| Avatar Group | ARIA `role="group"` | ARIA | — | | |
| Blockquote | HTML `<blockquote>` + `<figure>` | presentational | — | | |
| Breadcrumb | APG Breadcrumb | native | — | | `<nav>` > `<ol>` > `<a>`, `aria-current="page"`. |
| Button | APG Button / HTML `<button>` | native | — | | |
| Button Group | ARIA `role="group"` | ARIA | — | ≠ | No APG pattern of this name; grouping only. |
| Calendar | APG Grid (date grid) | ARIA | — | ≠ | "Calendar" is universal; the spec pattern is a grid. |
| Card | HTML `<article>` | presentational | — | | No spec component. |
| Carousel | APG Carousel | ARIA | — | | `aria-roledescription="carousel"`/`"slide"`. |
| Checkbox | APG Checkbox / native input | native | native | | Tri-state via the `indeterminate` DOM property. |
| Checkbox Group | native `<fieldset>` + checkboxes | native | native | | No distinct APG name. |
| Code | HTML `<code>` | presentational | — | | |
| Code Block | HTML `<pre><code>` | presentational | — | | Labelled `role="group"` wrapper. |
| Collapsible | APG **Disclosure** | ARIA | — | ≠ | Spec name is Disclosure; "Collapsible" is the ecosystem name. |
| Combobox | APG Combobox (editable, list autocomplete) | hybrid | hidden input | | `aria-activedescendant`, focus stays on the input. |
| Confirm Dialog | ARIA `dialog` on `<dialog>` | native | — | | The `confirm()` job; `urgent` → `alertdialog`. |
| Context Menu | APG Menu | ARIA | — | ≠ | Spec has no "context" variant name. |
| Count | ARIA `role="status"` | ARIA | — | ≠ | No spec component (a numeric badge). |
| Date Picker | APG Date Picker Dialog (grid in a popover) | hybrid | hidden input | | |
| Date Range Picker | APG date grid, range selection | hybrid | 2 hidden inputs | | |
| Dialog | APG Dialog (Modal) / HTML `<dialog>` | native | — | | `showModal()`: top layer, inert background (ADR 0005). |
| Dropdown Menu | APG **Menu Button** | ARIA | — | ≠ | Spec name is Menu Button. |
| Empty State | ARIA `role="status"` | ARIA | — | ≠ | No spec component. Calm sibling of Error State. |
| Error State | ARIA `role="alert"` | ARIA | — | ≠ | No spec component. |
| Feedback Icon | `role="img"` / `aria-hidden` | presentational | — | | |
| Field | HTML `<label>` + `aria-describedby` wiring | native | native | | Wires whatever control is slotted in. |
| Icon | HTML `<svg>` | presentational | — | | Decorative by default. |
| Inline Notification | ARIA live region (`status`/`alert`) | ARIA | — | ≠ | Deliberate divergence from "Alert" (naming map). |
| Keyboard shortcut (Kbd) | HTML `<kbd>` | presentational | — | | Component named exactly after the element. |
| Label | HTML `<label>` | native | — | | |
| Link | HTML `<a>` / APG Link | native | — | | |
| Loading | `role="status"` / `progressbar` | ARIA | — | ≠ | "Spinner" isn't a spec name either. |
| Loading Generation Area | `role="status"` | ARIA | — | ≠ | No spec component. |
| Login Form | HTML `<form>` | native | native | | Pattern/organism of native inputs. |
| Menu (nav list) | HTML `<nav>` landmark | native | — | ≠ | **Collides with APG "Menu"** (which means an *actions* menu). Watch for confusion. |
| Menubar | APG Menubar | ARIA | — | | |
| Meter | ARIA `role="meter"` | ARIA | — | | Native `<meter>` exists — candidate to go native. |
| Navigation Menu | APG Disclosure Navigation Menu | hybrid | — | | |
| Notification | ARIA live region (toast) | ARIA | — | ≠ | "Toast" isn't spec; renders through Inline Notification. |
| Notification Region | ARIA `role="region"` landmark | ARIA | — | | |
| Pagination | `<nav>` + `aria-current` | native | — | | No APG pattern exists. |
| PIN Input | `role="group"` + native inputs | hybrid | hidden input | | No spec component. |
| Popover | `aria-haspopup="dialog"` + `aria-expanded` | ARIA | — | | HTML **Popover API** exists — candidate to go native. |
| Progress | ARIA `role="progressbar"` | ARIA | — | | Native `<progress>` exists — candidate to go native. |
| Prompt Dialog | ARIA `dialog` on `<dialog>` + input | native | — | | The `prompt()` job. |
| Radio | native `<input type="radio">` | native | native | | |
| Radio Group | APG Radio Group / native radios | native | native | | |
| Rating Group | native radios (stars) | native | native | ≠ | No spec component. |
| Scroll Area | decorative overlay bars | presentational | — | | Native scrolling preserved. |
| Search Dialog | Dialog + Combobox composition | hybrid | — | ≠ | No single spec name ("command palette" isn't one either). |
| Segmented Control | native radio group | native | native | ≠ | iOS name; spec-wise it *is* a radio group. |
| Select | HTML `<select>` | native | native | | Exact spec name (ADR 0003). |
| Separator | ARIA `role="separator"` | ARIA | — | | Native `<hr>` exists — candidate to go native (horizontal case). |
| Sheet Dialog | APG Dialog on `<dialog>`, edge-anchored | native | — | ≠ | "Sheet"/"drawer" have no spec name. |
| Skeleton | `aria-hidden` placeholder | presentational | — | | |
| Slider | native `<input type="range">` / APG Slider | native | native | | |
| Stepper | `<nav>` + `aria-current="step"` | native | — | ≠ | No APG pattern. |
| Switch | ARIA `role="switch"` on native checkbox | hybrid | native | | Exact ARIA role name. |
| Table | HTML `<table>` + `aria-sort` | native | — | | |
| Table Set | APG Tabs wrapping a Table | ARIA | — | ≠ | Composition, no spec name. |
| Tabs | APG Tabs | ARIA | — | | |
| Tag | plain `<span>` chip | presentational | — | ≠ | No spec component. |
| Text Input | native `<input>` | native | native | | |
| Text Area | HTML `<textarea>` | native | native | | |
| [Time Field](time-field.md) | `role="spinbutton"` segments | ARIA | hidden input | | Deliberately ARIA (per-segment editing) over native `<input type="time">`; canonical value and validation contract documented. |
| Toggle Button | native checkbox styled as button | native | native | | APG "toggle button" uses `aria-pressed`; ours is a checkbox by design (form participation). |
| Toggle Group | `role="group"` visual wrapper | presentational | — | | Children carry their own semantics. |
| Toolbar | APG Toolbar | ARIA | — | | Roving tabindex. |
| Tooltip | ARIA `role="tooltip"` | ARIA | — | | Hoverable/dismissable per WCAG 1.4.13. |
| Tree View | APG Tree View | ARIA | — | | |
| Upload Drop Area | native `<input type="file">` | native | native | ≠ | No spec component; drag-and-drop is an enhancement. |

Not in the table: `drop-area` (a Svelte action, no markup), `hover-card`
(headless factory only — the styled behaviour folded into Popover), and
`TableView` (internal, not exported).

## Where our name diverges from the spec — and what to do

The native components already carry the spec name almost everywhere (Select,
Table, Label, Link, Button, Slider, Dialog, Kbd, Textarea…) — consistent with
the native-first stance. The divergences worth a decision:

| Ours | Spec | Recommendation |
| --- | --- | --- |
| Collapsible | Disclosure | Keep — "Collapsible" is what the ecosystem searches for; the naming map can gain a "Disclosure" row. |
| Dropdown Menu | Menu Button | Keep — same reasoning. |
| Menu (nav list) | *collides* with APG Menu (actions) | The only risky one: our "Menu" is navigation, the spec's "Menu" is actions. Consider renaming the pattern page (e.g. "Nav List") or adding a loud note. |
| Calendar | Grid (date grid) | Keep — nobody says "date grid". |
| Segmented Control, Sheet Dialog, Search Dialog, Tag, Count, … | no spec name exists | Nothing to adopt — the spec simply has no word for these. |

## Native opportunities (spec has a native element we don't use yet)

| Component | Native element | Note |
| --- | --- | --- |
| Progress | `<progress>` | Determinate-only fits our taxonomy; styling of the native bar is the trade-off to assess. |
| Meter | `<meter>` | Same assessment as Progress. |
| Separator | `<hr>` | Horizontal case only. |
| Popover | Popover API (`popover` attribute) | Would remove scripted outside-click/positioning glue; check browser support window against `docs/browser-support.md`. |

## Housekeeping found during the audit

- `inline-notification/InlineNotification.svelte`'s doc comment still calls the
  component "Alert" — stale from the rename; fix on next touch.
