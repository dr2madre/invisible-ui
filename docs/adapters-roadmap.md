# Multi-framework adapters roadmap

Tracks the effort to prove the framework-agnostic `@design-system/core` with
adapters beyond Svelte. This is technical-roadmap item **#6 (second framework
adapter)** expanded into a concrete plan.

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
  > `docs/adr/0003-python-adapter-wraps-react.md`.

## Representative components (the PoC set)

| Component | Why it's in the set |
| --- | --- |
| **Button** | Single-node, minimal `rootProps`. Baseline. |
| **Checkbox** | Controlled **native** input; `checked`/`indeterminate` are DOM properties, not attributes. |
| **Switch** | Controlled native `input[role=switch]`. |
| **Select** | The hard case: multi-part (label/trigger/listbox/option), Floating-UI positioning, typeahead, outside-pointer close, `aria-activedescendant`. |
| **Dialog** | Overlay: portal, focus-trap, scroll-lock, Escape, `initialFocus`. |

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
4. **Component specifics** — Select ports the Svelte adapter's DOM concerns to
   React (`@floating-ui/react-dom`'s `useFloating` replaces manual
   `computePosition`+`autoUpdate`; effects for outside-pointer, scroll-into-view,
   typeahead). Dialog ports `internal/{portal,focus-trap,scroll-lock}` to React
   (`createPortal`, focus-trap effect, overflow-lock effect) and honours
   `initialFocus`.
5. **Styling** — reuse the token CSS
   (`packages/svelte/src/lib/styles/tokens.css`); port the 5 styled components'
   `<style>` blocks to co-located CSS, keeping class names identical for visual
   parity.
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
   `docs/adr/0003-python-adapter-wraps-react.md`.
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
- `docs/adr/0003-python-adapter-wraps-react.md`.
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

- Extend the React adapter toward parity (the remaining ~32 core primitives and
  their styled components).
- A React-aware API-manifest generator (the current `scripts/generate-api.mjs`
  parses `.svelte` `export let` — it does not see `.tsx` props).
- Decide whether the docs site embeds React demos alongside the Svelte islands.
