# 8. The framework-free adapter is custom elements in the light DOM

- **Status:** Accepted
- **Date:** 2026-08-02

## Context

After Svelte, React and Reflex, the next target had to serve the audiences no
framework adapter reaches: plain HTML pages, server-driven stacks (HTMX,
LiveView, Hotwire, Livewire) and legacy portals being modernized. The
evaluation (`docs/next-adapter-strategy.md`) chose **Web Components (custom
elements)**: a W3C standard, consumable from any framework or none, immune to
framework churn by construction. This ADR records how the PoC
(`packages/elements`, the same six components as the React PoC) resolved the
implementation questions the strategy left open.

## Decision

- **Light DOM, not Shadow DOM.** The elements render real markup into the
  page's tree. This is the same native-first reasoning as ADR 0003 and 0005
  carried one level up: a real `<input>` in the real tree gives **native form
  participation** for free (no ElementInternals), real label association, the
  shared stylesheet with no boundary to pierce, and server-rendered HTML that
  upgrades in place with no Declarative Shadow DOM. Style encapsulation is by
  class namespacing — exactly the contract the Svelte and React adapters
  already ship. Shadow DOM remains available for a future element that truly
  needs slot composition; it is not the default.
- **Vanilla, zero runtime dependencies in the seam.** No Lit, no Stencil: the
  heavy lifting is in the core, and the adapter seam is ~60 lines
  (`applyProps`) that maps the core's prop bags onto attributes and listeners
  — with the same ARIA-boolean serialisation the Svelte seam needs and the
  same `rootDomProps` handling every adapter shares.
- **Self-contained dist.** The built `define.js` bundles the core and Floating
  UI so a script tag genuinely works with no build step and no import map —
  this package's whole reason to exist.
- **HTML-native item API.** `<ds-select>` and `<ds-combobox>` read light-DOM
  `<option>` children (or an `items` property) — ideal for server-rendered
  fragments.
- **Naming around platform collisions.** The dialog's title attribute is
  `heading` (the global `title` attribute is a browser tooltip). Events are
  bubbling `CustomEvent`s (`change`, `input-change`, `open-change`) with typed
  `detail`; inner native events are stopped so consumers never hear doubles.

## Consequences

- One adapter now covers the pure-JS story, Vue/Angular consumers (both handle
  custom elements natively), server-driven trends and legacy modernization —
  with **no core changes**, again.
- A real-browser smoke run caught a genuine defect the unit tests missed (the
  combobox rebuilt its option nodes mid-gesture, detaching the pressed node);
  fixed by rebuilding only when the item list changes and re-decorating nodes
  in place. Real-browser verification stays part of the adapter recipe.
- Further framework adapters (Vue, Solid, Angular, …) are demand-driven: the
  elements already serve those users at standard-interop quality.
- Light DOM means consumer CSS *can* reach into the components — accepted, and
  identical to the Svelte/React adapters' global-CSS stance.
