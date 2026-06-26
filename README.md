# Nozca-ui

_by nozcadesign_

A **headless, accessible, multi-framework** component library — built from scratch.

> **⚠️ Alpha — in active development.** APIs, design tokens, and package names
> may change without notice, and the packages are not yet published to npm. Not
> recommended for production use yet.

> **Status:** The framework-agnostic core, the **Svelte** adapter, and the full
> component set (Phases 1–6 — overlays, modals, navigation, form & value,
> data/presentational, and date & time) are in place, each as a **headless**
> primitive _and_ a **styled, token-driven** component, with light/dark design
> tokens, `vitest`/`vitest-axe` coverage, and an Astro docs site with a live
> demo per component. More framework adapters can follow; they reuse the same
> pattern.
>
> The npm packages are currently named `@design-system/*` and are unpublished;
> they'll be renamed to the **Nozca-ui** scope when publishing (see
> `docs/technical-roadmap.md`).

## What this is

This is a **headless** design system. It ships the *behavior*, *state*, and
*accessibility* of UI components — without imposing any visual styling. You
own the look; the library owns the hard parts: keyboard interaction, focus
management, ARIA semantics, and cross-framework consistency.

In other words, it provides unstyled primitives (like a menu, dialog, combobox,
or tabs) that are fully accessible and ready to be styled with whatever CSS
approach you prefer — utility classes, CSS modules, vanilla CSS, or your own
theme tokens.

This contrasts with styled component libraries, which bundle opinions about
appearance. Here, presentation is intentionally left to the consumer.

## Goals & principles

- **Accessibility (a11y) — first class.** Components follow established
  [WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/) patterns, with proper roles
  and attributes, full keyboard navigation, and correct focus management.
  Accessibility is a requirement, not an add-on.
- **Responsiveness.** Components are designed to behave correctly across
  viewport sizes and input modalities (pointer, touch, keyboard).
- **Headless.** No opinionated styling is shipped. Consumers bring their own
  design language and CSS.
- **Multi-framework parity.** Shared behavior is exposed consistently across
  frameworks (e.g. React and Svelte) so the same primitive behaves the same
  way everywhere.
- **Built from scratch.** Primitives are implemented directly rather than
  wrapping existing libraries, keeping behavior, bundle size, and a11y under
  our control.

## Inspiration

The project is inspired by [Bits UI](https://bits-ui.com/) (headless,
accessible primitives) — which itself stands on the shoulders of
[Melt UI](https://melt-ui.com/) (internal architecture),
[Radix UI](https://www.radix-ui.com/) (API design) and
[React Spectrum](https://react-spectrum.adobe.com/) (accessibility, and
date/time). It differs in two key ways: everything is **built from scratch**,
and it is **multi-framework** from the ground up rather than tied to a single
ecosystem.

## Design decisions & foundations

- [ADR 0001 — Headless vs. Amber's styled Web Components](./docs/adr/0001-headless-vs-amber-web-components.md):
  why this project is headless and how it relates to Bitrock's
  [Amber Design System](https://amber.bitrock.it/).
- [Foundations](./docs/foundations.md): optional, fully customizable design
  guidelines (system font stack, color scale, WCAG AA contrast) applied on top
  of the headless primitives.

## Repository structure

```
design-system/
├── core/                  # @design-system/core — framework-agnostic state, behavior, a11y
├── packages/
│   └── svelte/            # @design-system/svelte — thin Svelte adapter
├── examples/
│   └── svelte/            # runnable usage example
└── (future adapters)      # React, Vue, … plug into the same core
```

The monorepo uses pnpm workspaces + Turborepo. A shared `core/` holds the
framework-agnostic behavior and accessibility logic; thin per-framework
adapters expose it idiomatically. **Svelte** is the first adapter; the core is
deliberately framework-agnostic so additional adapters can be added later
without touching behavior.

### How it works

Each component in `core/` is a pure state plus a `connect()` function that
returns framework-agnostic **prop getters** carrying ARIA attributes,
`data-*` styling hooks, and event handlers. An adapter applies those props in
its own idiom — the Svelte adapter does so through a `use:` action — so
behavior and accessibility are written once and shared.

## Getting started

```bash
pnpm install     # install workspace dependencies
pnpm build       # build core, then the adapters (Turborepo)
pnpm test        # unit tests (core) + interaction & axe a11y tests (Svelte)
pnpm typecheck   # type-check all packages
```

Run the example app:

```bash
pnpm --filter @design-system/example-svelte dev
```

A **docs site** built with [Astro](https://astro.build) +
[Starlight](https://starlight.astro.build) — with **live, interactive component
demos** (each styled component embedded as a Svelte island) plus prop tables,
accessibility notes and usage examples — is published to **GitHub Pages** on
every push to `main`: **https://dr2madre.github.io/design-system/** (see
[`.github/workflows/docs.yml`](./.github/workflows/docs.yml)).

Run the docs site locally:

```bash
pnpm --filter @design-system/docs dev      # dev server
pnpm --filter @design-system/docs build    # static build
```

The site's pages live in `packages/docs/src/content/docs/` and the demos in
`packages/docs/src/demos/`.

### Components

- **Button** — defaults to a safe `type="button"`, exposes a `data-disabled`
  hook, and can be rendered on a non-native element (`nativeButton: false`)
  where it emulates the button role, focusability, and Enter/Space activation.
  Carries a **semantic `variant`** (`default` / `primary` / `secondary` /
  `ghost` / `danger`, surfaced as `data-variant`) — *what the action means*, not
  a style: `default` is the baseline medium-emphasis button, `primary` is the
  main action to move the flow forward, `secondary` is an alternative emphasized
  action on the brand's secondary color, `ghost` is a reduced-affordance
  low-emphasis button, `danger` is destructive. A **styled** `Button.svelte`
  realises these
  with themeable `--ds-button-*` tokens, plain (un-boxed) leading/trailing icons
  (default plus, overridable via `left`/`right` slots), and — for `danger` — a
  hazard icon by default so meaning never relies on color alone (WCAG 1.4.1).
  Imported from `@design-system/svelte/Button.svelte`.
- **Button Group** — a labelled `role="group"` that groups related action
  buttons (it holds no selection; each button stays an independent action and
  tab stop — unlike a Radio Group or Segmented Control). A **styled**
  `ButtonGroup.svelte` lays them out horizontally or vertically and, when
  `attached`, joins them into one segmented bar (collapsing inner corners and
  shared borders); spacing is themeable via `--ds-button-group-*`. Imported from
  `@design-system/svelte/ButtonGroup.svelte`.
- **Toggle Button** — a button that is on or off (`aria-pressed`,
  `data-state="on" | "off"`), suited to toolbars (e.g. Bold/Italic). Distinct
  from a **Switch**: a toggle button is an action, a switch is a setting. A
  **styled** `ToggleButton.svelte` realises this with themeable `--ds-toggle-*`
  tokens, from `@design-system/svelte/ToggleButton.svelte`.
- **Toolbar** — a grouping container (`role="toolbar"`, required `label`) for a
  set of controls (buttons, toggle buttons), optionally divided into groups with
  a `Separator`. From `@design-system/svelte/Toolbar.svelte`.
- **Separator** — a thin divider; semantic by default (`role="separator"` +
  `aria-orientation`) or `decorative` to hide it from assistive tech.
  Horizontal or vertical, themeable via `--ds-separator-*`. From
  `@design-system/svelte/Separator.svelte`.
- **Avatar** — an account image that falls back to the **initials** of `name`
  when no image is set or the image fails to load. Exposed as a single labelled
  image (`role="img"` + `aria-label`) so it reads the same either way;
  size/shape/colors themeable via `--ds-avatar-*`. From
  `@design-system/svelte/Avatar.svelte`.
- **Checkbox** — a WAI-ARIA checkbox with tri-state support
  (`checked` / `unchecked` / `indeterminate`), exposing `aria-checked`
  (incl. `mixed`) and `data-state`, activated by click and the Space key. A
  **styled** `Checkbox.svelte` (box + check/dash glyphs, label wired via
  `aria-labelledby`, themeable `--ds-checkbox-*`) is available from
  `@design-system/svelte/Checkbox.svelte`.
- **Checkbox Group** — a multi-select group of checkboxes (`role="group"` of
  `role="checkbox"` items): each item is independently Tab-focusable and toggled
  with Space, several can be checked, with per-item and whole-group `disabled`.
  The **styled** `CheckboxGroup.svelte` reuses the checkbox box/check visual and
  requires a group `label`. Imported from
  `@design-system/svelte/CheckboxGroup.svelte`.
- **Switch** — a WAI-ARIA switch (`role="switch"` + `aria-checked`). A
  settings-style on/off control; screen readers announce on/off. (Sometimes
  called a "toggle switch" — different from the Toggle Button above.) A
  **styled** `Switch.svelte` (sliding track + thumb, themeable `--ds-switch-*`)
  is available from `@design-system/svelte/Switch.svelte`.
- **Radio Group** — a single-select WAI-ARIA radio group with roving tabindex
  and arrow/Home/End navigation (selection follows focus), exposing
  `aria-checked` and `data-state` per item. A **styled** `RadioGroup.svelte`
  (dot indicator, `items` with optional `label`, themeable `--ds-radio-*`) is
  available from `@design-system/svelte/RadioGroup.svelte`.
- **Segmented Control** — the same radio-group semantics, defaulting to a
  horizontal layout and styled as a segmented bar. A **styled**
  `SegmentedControl.svelte` (themeable `--ds-segment-*`) is available from
  `@design-system/svelte/SegmentedControl.svelte`.
- **Tabs** — a WAI-ARIA tabs widget: a tablist of tabs linked to panels
  (`aria-controls`/`aria-labelledby`), roving tabindex, arrow/Home/End
  navigation, and `automatic` or `manual` activation. A **styled** `Tabs.svelte`
  (underline indicator + panels, themeable `--ds-tabs-*`) is available from
  `@design-system/svelte/Tabs.svelte`.
- **Accordion** — a WAI-ARIA accordion: header buttons (`aria-expanded`) linked
  to regions, `single` or `multiple` expansion (single optionally collapsible),
  and arrow/Home/End movement between headers. A **styled** `Accordion.svelte`
  (bordered items + rotating chevron, themeable `--ds-accordion-*`) is available
  from `@design-system/svelte/Accordion.svelte`.
- **Text Field** — a text-entry primitive that owns the parts that are easy to
  get wrong: id generation and the label / hint / error wiring (`for`,
  `aria-describedby`, `aria-invalid`, `aria-required`) plus the
  disabled / read-only / invalid flags as `data-*` hooks (typing stays native).
  Two **styled** components consume it with themeable `--ds-field-*` tokens:
  `TextField.svelte` (single-line — `text` / `search` / `email` / `password` /
  `tel` / `url` / `number`, with optional description and error message) and
  `Textarea.svelte` (multi-line). A non-empty `error` flips the field to the
  invalid state and announces the message. Imported from
  `@design-system/svelte/TextField.svelte` and
  `@design-system/svelte/Textarea.svelte`.
- **Select** — a collapsible single-select dropdown (WAI-ARIA select-only
  combobox): a `role="combobox"` trigger opens a `role="listbox"` popup, with
  arrow / Home / End navigation, typeahead, and `aria-activedescendant` (DOM
  focus stays on the trigger). The behaviour and a11y are headless in the core;
  the **styled** `Select.svelte` adds the trigger, the checkmarked options and
  the elevated popup, themeable via `--ds-select-*`. Popup **positioning** —
  flip when there's no room below, shift to stay on screen, and stay attached on
  scroll — is handled in the Svelte adapter via
  [`@floating-ui/dom`](https://floating-ui.com/) (a dependency of the adapter,
  not the core, since it is pure geometry rather than behaviour/a11y). Imported
  from `@design-system/svelte/Select.svelte`.
- **Dropdown Menu** — a menu button (WAI-ARIA menu button pattern): a trigger
  opens a `role="menu"` of action items, with arrow / Home / End navigation,
  typeahead, focus moving **into** the menu and returning to the trigger on
  close, and Escape / outside-pointer to dismiss. Headless behaviour in the core
  (`menu`); the **styled** `DropdownMenu.svelte` adds the trigger and the
  elevated popup, themeable via `--ds-menu-*`, positioned with `@floating-ui/dom`
  (flip/shift). Imported from `@design-system/svelte/DropdownMenu.svelte`.
- **Popover** — a non-modal floating panel anchored to a trigger
  (`aria-haspopup="dialog"` / `aria-expanded`). Focus moves into the panel on
  open and returns to the trigger on Escape; outside-press or focus-leave also
  closes. Headless behaviour in the core (`popover`); the **styled**
  `Popover.svelte` adds the elevated panel, themeable via `--ds-popover-*`,
  positioned with `@floating-ui/dom` (flip/shift). Built on the shared overlay
  utilities (`internal/floating.ts`, `internal/dismiss.ts`). Imported from
  `@design-system/svelte/Popover.svelte`.
- **Tooltip** — a descriptive label shown on hover **and** focus
  (`role="tooltip"`, linked via `aria-describedby`), with open/close delays and
  WCAG 1.4.13 semantics (hoverable + Escape-dismissable). Headless behaviour in
  the core (`tooltip`); the **styled** `Tooltip.svelte` adds the label, themeable
  via `--ds-tooltip-*`, positioned with `@floating-ui/dom`. Imported from
  `@design-system/svelte/Tooltip.svelte`.
- **Icon** — a standardized SVG wrapper for the system's glyphs (and any icon
  you drop in): a 24×24 viewBox, `1em` sizing (scales with font-size),
  `currentColor`, rounded strokes, and a11y (decorative by default, or `label`
  for a named image). Pass the glyph shapes via the default slot — this is also
  the seam for swapping in a Lucide / FontAwesome / custom icon set uniformly.
  Used internally (e.g. FeedbackIcon) and from
  `@design-system/svelte/Icon.svelte`.
- **FeedbackIcon** — a status icon in a rounded, **tinted** box
  (`info` / `success` / `warning` / `danger` / `neutral`): the box is the status
  color at 15% and the glyph is the full status color. Unlike the headless
  primitives this is a *styled* component (ships SVGs + CSS) — the icon
  communicates the feedback type at a glance, an accessibility aid for alerts.
  Colors are themeable CSS custom properties (`--ds-feedback-*`); the built-in
  icon per status can be overridden via the default slot. Imported from
  `@design-system/svelte/FeedbackIcon.svelte`.
- **Alert** — a styled feedback banner composed from the building blocks: a
  FeedbackIcon (status), title, body text, an optional link, an `actions` slot
  for buttons (e.g. Retry / Cancel), and an optional close button. A live region
  (`role="status"` by default, `role="alert"` for
  urgent messages); **not dismissible by default** — set `closable` to render
  the ghost close button. Status is conveyed by color + glyph + surface tint
  (never color alone). Surface colors are themeable (`--ds-alert-*`). Imported
  from `@design-system/svelte/Alert.svelte`.
- **Notice** — an ephemeral, auto-dismissing Alert for stacked alerts.
  `createNotifier()` is a small store (`show` / `update` / `dismiss` / `clear` /
  `promise`); `NoticeRegion` is a fixed, labelled (`role="region"`)
  stacking container that renders the queue at a chosen `placement`. Each
  notice auto-dismisses after `duration` (pausing on hover/focus — WCAG
  2.2.1), is closable, and may carry **action buttons**. Notices
  **enter/leave** with a fly/fade transition and the stack reflows via FLIP
  (disabled under reduced motion); `maxVisible` caps how many show at once,
  queuing the rest. `notifier.promise(p, { loading, success, error })` shows a
  loading notice that swaps to success/error when the promise settles.
  Position is set on the region via `placement` (top/bottom × start/center/end).
  An `inverted` option renders a high-contrast surface (the opposite of the
  page) for maximum visibility — recommended for transient info outcomes (saved,
  back online, downtime…). The notice has no presentational wrapper: the
  Alert *is* the live region, and the floating elevation is applied by the
  region. Imported from `@design-system/svelte` (the notifier) and
  `@design-system/svelte/NoticeRegion.svelte` / `Notice.svelte`.
- **CloseButton** — a styled "dismiss" button (the × in alerts, dialogs,
  notices), built on the headless Button. *Ghost* treatment: no border or fill at
  rest, with a generous square hit area around a small icon (WCAG 2.5.8 Target
  Size). Accessible name via `label` (default "Close"); fires `onclose`. Sizing
  and colors are themeable CSS custom properties (`--ds-close-*`). Imported from
  `@design-system/svelte/CloseButton.svelte`.

### Svelte usage

The library is headless — you bring the markup and the styling, it brings the
behavior and accessibility:

```svelte
<script>
  import { createButton, createSwitch } from "@design-system/svelte";

  const { rootAction: buttonAction } = createButton({ onPress: () => save() });
  const { rootAction: switchAction, state } = createSwitch();
</script>

<button use:buttonAction>Save</button>

<button class="switch" use:switchAction aria-label="Wi-Fi"></button>

<style>
  /* style via the data-state hooks the switch exposes */
  .switch:global([data-state="checked"]) { background: black; }
</style>
```

The rendered elements get the correct ARIA attributes plus `data-state` /
`data-disabled` styling hooks, and are fully keyboard, pointer, and touch
operable.

If you'd rather not wire up the markup and CSS yourself, each primitive also
ships an opt-in **styled** component that consumes the design tokens (so it
follows the light/dark theme out of the box) and stays fully themeable through
`--ds-*` custom properties:

```svelte
<script>
  import Switch from "@design-system/svelte/Switch.svelte";
  import Tabs from "@design-system/svelte/Tabs.svelte";
</script>

<Switch checked onCheckedChange={(on) => console.log(on)}>Wi-Fi</Switch>

<Tabs
  label="Settings"
  value="account"
  items={[
    { value: "account", label: "Account", content: "Account settings." },
    { value: "password", label: "Password", content: "Password settings." },
  ]}
/>
```

These are thin wrappers over the headless primitives — same behavior and
accessibility, with a default look you can re-theme via tokens.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the
branching workflow, commit conventions, and how to propose a new component.

## License

Licensed under the [Apache License 2.0](./LICENSE).
