# 10. The Vue adapter is native composables over the core

- **Status:** Accepted
- **Date:** 2026-08-02

## Context

The adapter strategy (`docs/next-adapter-strategy.md`) already gives Vue apps
a working path: Vue consumes custom elements natively, so `packages/elements`
serves Vue today. The same strategy marked a dedicated Vue adapter as a
demand-driven option. This ADR records the proof of concept that option turned
into: `packages/vue`, with Button, Checkbox, Switch and Select, the same
recipe the React adapter followed.

## Decision

- **Native composables over the agnostic core.** `useButton`, `useCheckbox`
  and `useSwitch` mirror the React hooks: the composable owns the resolved
  state in a `ref`, hands the core a setter, and recomputes `connect()` inside
  a `computed`, so the returned prop bags always close over current state. An
  externally controlled value is mirrored by a `watch`. The core runs in the
  browser, unchanged.
- **A near-identity `normalize` seam.** Vue's renderer accepts DOM attribute
  spellings (`tabindex`, `class`, `for`) and camelCase listener props
  (`onClick`, `onChange`), which is exactly what `connect()` emits. The seam
  only drops `undefined` values. It stays a named function so the adapter has
  one place to add a rename if a future primitive needs one, and so every
  adapter hands `connect()` an explicit `normalize`.
- **`rootDomProps` applied generically.** A `useDomProps` composable (a
  post-flush `watchEffect`) assigns whatever DOM-only properties the core
  declares, today `input.indeterminate`. Same contract as the React hook and
  the elements seam.
- **`v-model` plus the callback props.** Checkbox and Switch bind
  `v-model` for the checked value, Select for the selected value; the React
  adapter's callbacks (`onCheckedChange`, `onValueChange`, `onPress`) work
  unchanged alongside. Both fire on every change.
- **Render functions, no new tooling.** Components are `defineComponent` +
  `h()`. No SFCs means no template compiler, no Vue build plugin, and a
  vitest + Testing Library + axe setup identical in shape to the React
  package's. Build is tsup, ESM only, `vue` external.
- **Styles are copies, guarded.** The four component stylesheets and
  `tokens.css` are byte-identical copies of the React adapter's; a parity test
  fails on any drift, the same guard the elements package uses.
- **i18n via `provide`/`inject`.** `LocaleProvider` and `useI18n` carry the
  message catalog, scoped to the keys these four components read
  (`select.placeholder`, `switch.on`, `switch.off`).

## Consequences

- The core needed **zero changes**, measured on this PoC: `core/` is untouched
  by the Vue package. Three native adapters (Svelte, React, Vue) plus the
  custom elements now consume the same `connect()` contract.
- Vue apps get a choice: the custom elements adapter works today with
  standard interop, and this adapter adds the idiomatic layer (`v-model`,
  reactive props, template refs, `provide`/`inject` i18n) for teams that want
  Vue-native ergonomics.
- The peer range is `vue ^3.4`. The Select generates its label/error ids from
  a module counter because Vue's own `useId` requires 3.5; server-side
  rendering of this package is untested and out of scope for the PoC.
- The package is private and unpublished, like the other adapters at this
  stage.

## Addendum, 2026-08-02: the shared set is complete

Combobox and Dialog shipped the same day, so the Vue adapter carries all six
components of the shared set. Two notes from that work:

- The Combobox positions its popup with `@floating-ui/dom` driven by a
  post-flush watch, the approach the Svelte and elements adapters already
  use. Options are keyed by value, which keeps each option element across
  highlight changes: a pointer press selects the option it started on.
- The `normalize` seam carries the rename its docstring anticipated. Vue
  derives a DOM event name by hyphenating what follows `on`, so a multi-word
  key such as `onKeyDown` resolves to `key-down`. The seam collapses handler
  keys to a single capitalized word (`onKeydown`, `onMouseenter`), which is
  what the components with keyboard and pointer behavior need, and what
  makes Enter and Space work on `useButton({ nativeButton: false })`.
  Single-word keys pass through unchanged.

The core still needed zero changes.

## Addendum, 2026-08-03: full parity

The Vue adapter carries the whole catalog: every Svelte component has a Vue
counterpart, ported batch by batch (forms core, overlays and menus, feedback,
data and navigation, controls, the date and navigation surfaces, and the
closing set with carousel, tree view, stepper, the sheet and search dialogs
and the table composites). The core needed zero changes across all of them,
with one exception recorded here: `core/calendar` now reads an empty value
and an empty focused date as nothing selected, since the empty string reached
the date formatters as an invalid date. Every adapter gains that reading.

One Vue-side note worth keeping: trigger listeners that must exist before the
first user gesture are declared as prop bags the component spreads, since Vue
assigns template refs after the render that needs them.

`useMenubar` read its menu list once at setup, so a menubar built from data
that arrived later kept the first list until it remounted. Each menu now owns
an effect scope created the first time its position exists, and the composable
returns the menus as a computed, so the bar follows the list as it grows,
shrinks or reorders. Scopes for dropped positions stop with the list, and all
of them stop with the owning scope.
