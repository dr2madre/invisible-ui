# Multi-framework adapters roadmap

Tracks the effort to prove the framework-agnostic `@design-system/core` with
adapters beyond Svelte. This is technical-roadmap item **#6 (second framework
adapter)** expanded into a concrete plan. For what comes *after* (Web
Components, Vue, Flutter tokens, Rust): `docs/next-adapter-strategy.md`.

**Scope for the first pass: proof-of-concept, 4–6 representative components** —
not full parity. The goal is to establish the pattern and prove portability, so
the chosen components exercise every integration shape the core exposes.

## Why these frameworks

- **React** — the real second adapter. Native consumer of the core's
  prop-getter model, and the substrate several Python UI frameworks compile to.
- **Reflex (Python)** — chosen Python target. Reflex compiles Python → React, so
  a Reflex component is a thin `rx.Component` wrapper over the **React components
  built here** rather than a re-implementation of `connect()`. This is the only
  Python approach that inherits full client behaviour (keyboard, focus, dynamic
  ARIA) for free.

  > **Constraint (must stay documented).** The interactive behaviour of every
  > primitive — keyboard navigation, focus management, `aria-activedescendant`,
  > popup positioning — lives in the TS core and runs in the browser as
  > JavaScript. Python cannot supply that layer. A server-side-only Python
  > target (FastHTML, NiceGUI, Streamlit/Dash without a React island) could
  > render the accessible static markup but would need a JS runtime for
  > behaviour, so it is explicitly out of scope for this PoC. See
  > `docs/adr/0006-python-adapter-wraps-react.md`.

## Representative components (the PoC set)

| Component | Why it's in the set |
| --- | --- |
| **Button** | Single-node, minimal `rootProps`. Baseline. |
| **Checkbox** | Controlled **native** input; `checked`/`indeterminate` are DOM properties, not attributes. |
| **Switch** | Controlled native `input[role=switch]`. |
| **Select** | Native `<select>` styled by the adapter (ADR 0003), so it proves the *non-core* half of an adapter: markup, ids, labelling and the invalid state. |
| **Combobox** | The hard case, and the design system's **advanced (non-native) select**: multi-part (label/input/listbox/option), Floating-UI positioning, filtering, `aria-activedescendant` with DOM focus pinned to the input, outside-pointer close, scroll-into-view. |
| **Dialog** | The overlay shape: native `<dialog>` + `showModal()` (ADR 0005), scroll lock, backdrop light-dismiss, `initialFocus`, focus restore, and Escape that closes only the innermost of stacked dialogs. |

## Key integration finding

The core already emits **React-style camelCase event keys** (`onClick`,
`onChange`, `onKeyDown`, `onMouseDown`, `onMouseEnter`) alongside attribute keys
(`role`, `id`, `type`, `disabled`, `data-*`, `aria-*`, `tabindex`). So the React
`normalize` is **near-identity** — pass attributes and handlers straight through
to JSX, with a tiny key-rename map for DOM→React differences
(`tabindex`→`tabIndex`; guard `for`→`htmlFor`, `class`→`className`). React
serialises boolean `aria-*` itself, so none of the manual `"true"`/`"false"`
coercion the Svelte `applyProps` needs.

Contrast with the Svelte adapter, which applies props via `use:` actions and
must bookkeep event listeners in `createPropsAction`. In React the connected
`api` is recomputed per render (`useMemo`) and spread onto JSX, so handlers
always close over current state — no listener bookkeeping.

## Status

**Both parts are complete.** Part A: Button, Checkbox, Switch, Select, Combobox
and Dialog (`packages/react`, 89 tests incl. axe). Part B: the same six as
Reflex wrappers (`packages/reflex`, importable as `invisible_ui`; 8 render
tests) — thin `rx.Component` subclasses over the React build, per ADR 0006.
Until `@design-system/react` is published to npm, a consuming Reflex app must
make the package resolvable itself (see the package README); the example app
lives in `examples/reflex`.

**What the pass proved:** the core needed **no change at all** to drive a second
framework. That claim only became load-bearing with the **Combobox**: the first
four components are a `connect()` and a spread (and the native Select does not
touch the core at all), so they exercise the seam but not the state machine. The
Combobox does — multi-part prop bags, a highlight tracked separately from DOM
focus, a positioned popup, filtering owned by the adapter — and it ported with
no core change either, the Svelte and React versions differing only in how state
is held (`useState` + `useMemo` vs a store) and how DOM concerns attach (effects
+ ref callbacks vs actions). The **Dialog** closed the last shape, the overlay,
and turned out to be the *easiest* of the three: since ADR 0005 modality is the
platform's (`<dialog>` + `showModal()` — top layer, inert background, real focus
trap), so the adapter only ports scroll lock, backdrop light-dismiss, initial
focus and focus restore. The Svelte action's lifecycle maps one-to-one onto a
`useEffect` gated on `open`. Frictions worth recording:

- **DOM properties needed an escape hatch — now closed.** `indeterminate` has
  no HTML attribute, so it cannot travel in a prop bag: each adapter was setting
  it by hand (a Svelte action, a React `ref` effect), which meant a third
  adapter could silently omit it — the checkbox would look right and never show
  the dash. The core now **declares** such properties in a `rootDomProps` bag
  (see `DomProps` in `core/src/types.ts`), and each adapter applies it
  generically: one `domProps` action in Svelte, one `useDomProps` hook in React,
  neither knowing any property name. A component gaining a new DOM-only property
  is picked up by both adapters with no change. `checked` / `value` / `disabled`
  deliberately stay in `rootProps`, where the framework's own controlled-input
  handling owns them.
- **Controlled-value mirroring is adapter-specific.** Svelte's `$:` sync becomes
  a render-phase comparison against the previous prop (cheaper than an effect,
  no double render). Worth factoring into a shared helper once more controlled
  components land.

## Part A — React adapter (`packages/react`)

1. **Scaffold** — `@design-system/react`, ESM, `tsup` build; peer deps
   `react`/`react-dom` (`^18 || ^19`); deps `@design-system/core` (workspace),
   `@floating-ui/react-dom`. Vitest + `@testing-library/react` + `vitest-axe`.
   Picked up by the existing `packages/*` workspace glob.
2. **`src/normalize.ts`** — the near-identity seam described above.
3. **Per-component `useX(context)` hook** — mirrors each `create-*.ts`:
   `useState` for resolved state, `useCallback` setters that fire the
   `onXChange` context callback, `useMemo(() => core.x.connect({ state, setters,
   normalize }))`. Styled component spreads the prop bag onto JSX; native
   `checked`/`indeterminate` set via a `ref` effect (as Svelte binds the DOM
   property).
4. **Component specifics** — Combobox ports the Svelte adapter's DOM concerns to
   React (`@floating-ui/react-dom`'s `useFloating` replaces manual
   `computePosition`+`autoUpdate`; effects for outside-pointer and
   scroll-into-view). Dialog needs no portal or focus trap — since ADR 0005 it
   renders a native `<dialog>` and calls `showModal()`, so only scroll lock,
   backdrop light-dismiss, `initialFocus` and focus restore are ported, in a
   `useEffect` gated on `open`.
5. **Styling** — the token CSS is copied from the Svelte adapter and held
   byte-identical by a parity test; each styled component's `<style>` block is
   ported to a co-located CSS file, class names kept identical for visual parity.
6. **Tests** — port the behavioural assertions from the Svelte suite (role/name,
   keyboard, controlled callbacks, `data-state`, `axe()`), green under
   `pnpm --filter @design-system/react test`.

## Part B — Reflex adapter (`packages/reflex`, Python)

1. **Wrap the React build** — each PoC component becomes an `rx.Component`
   subclass with `library = "@design-system/react"`, `tag = "Select"` (etc.),
   typed component vars mirroring the React props, and event triggers mapping to
   `onValueChange`/`onCheckedChange`/…
2. **Package** — `packages/reflex/pyproject.toml` (Python, outside the pnpm
   workspace) declaring the React package as its JS dependency;
   `invisible_ui/__init__.py` exporting the 5 wrappers.
3. **ADR** — record the wrap-React decision and the JS-behaviour constraint in
   `docs/adr/0006-python-adapter-wraps-react.md`.
4. **Example** — `examples/reflex/` minimal app; `reflex run` / `reflex export`
   smoke check. A full Python test harness is out of PoC scope.

## New dirs / files

- `packages/react/` — configs, `src/normalize.ts`,
  `src/internal/{portal,focus-trap,scroll-lock}.tsx`,
  `src/{button,checkbox,switch,select,dialog}/{use-*.ts,*.tsx,*.css,*.test.tsx}`,
  `src/index.ts`.
- `examples/react/` — Vite + React demo app.
- `packages/reflex/` — `pyproject.toml`, `invisible_ui/*.py`.
- `examples/reflex/` — minimal Reflex app.
- `docs/adr/0006-python-adapter-wraps-react.md`.
- Root `package.json` release list — add `@design-system/react`.

## Verification

1. `pnpm --filter @design-system/core build` (consumed by the React adapter).
2. `pnpm --filter @design-system/react build` — clean ESM + `.d.ts`.
3. `pnpm --filter @design-system/react test` — vitest + axe green for the 5.
4. `pnpm --filter @design-system/example-react dev` — manually keyboard-drive
   Select (arrows/typeahead/Escape) and Dialog (focus trap, Escape) in a browser.
5. `cd examples/reflex && reflex run` — components render and `on_value_change`
   fires into Python state.

## Follow-ups (beyond the PoC)

- Extend the React adapter from the shared six toward full catalog parity.
- [x] Extend the API-manifest generator beyond Svelte: it now reads Svelte,
  Vue, React and custom elements (completed in #200).
- Decide whether the docs site embeds React demos alongside the Svelte islands.
