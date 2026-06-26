---
title: "Roadmap"
---

Component build-out plan for the design system. Every component ships the same
"parity bar": a headless primitive in `@design-system/core`, a Svelte adapter,
a styled themeable component (`--ds-*` tokens), `vitest` + `vitest-axe` tests, a
Storybook story, a `docs/components.md` entry, and a Kitchen Sink entry.

## Phase 1 — Menus & overlays foundation ✅

Dropdown Menu, Popover, Tooltip, Context Menu.

## Phase 2 — Modal layer ✅

Dialog (#48), Alert Dialog (#49), Sheet & Drawer (#50, with full
drag-to-dismiss). Introduced the shared modal foundation now on `main`:
`core/dialog` and the `internal/{portal,focus-trap,scroll-lock}` utilities behind
`createDialog`.

## Phase 3 — Rich navigation & search ✅

Hover Card (#51), Menubar (#52), Combobox (#53), Command (#54, a combobox in a
dialog), Navigation Menu (#55).

## Phase 4 — Form & value components

No overlay dependencies — parallelizable. One PR per component (or small related
groups), merged with the deploy verified — same rhythm as Phases 1–3. Each ships
the full parity bar above. The build approach per component (reuse existing
primitives wherever possible, only add core when needed):

| Component | Core approach | Reuse strategy |
| --- | --- | --- |
| Collapsible | new minimal `core/collapsible` | single-item disclosure (the existing `core/accordion` is multi-panel — overkill here) |
| Aspect Ratio | presentational, no state | pure CSS `aspect-ratio` |
| Progress | new `core/progress` | one-way `role="progressbar"` value/range wiring |
| Meter | new `core/meter` | `role="meter"` value/range wiring |
| Label | minimal `core/label` | id / `for` association pattern from `core/text-field` |
| Field | new `core/field` | reuse `core/text-field`'s id linking + smart `aria-describedby` |
| Toggle Group | new `core/toggle-group` | roving via `core/internal/collection`; ids like `core/tabs` |
| Slider | new `core/slider` | pointer-drag + keyboard; disabled/id pattern |
| Pagination | reuse the `core/tabs` roving pattern | single-select roving + Home/End |
| PIN Input | new `core/pin-input` | per-cell inputs + id linking from `core/text-field` |
| Rating Group | **reuse `core/radio-group`** | render items as stars in the Svelte layer (no new core) |
| Scroll Area | new `core/scroll-area` | DOM scroll + custom scrollbars |

## Phase 5 — Data & presentational

- Avatar Group
- Badge / Tag
- Card
- Table / Data list
- Skeleton
- Toolbar
- Tree View
- Carousel
- Timeline / Steps (Stepper)

## Phase 6 — Date & time

- Calendar
- Date Picker
- Date Range Picker
- Time Field

---

## Docs tooling — Storybook → Astro + Starlight (planned / deferred)

Separate track from the component build-out. Planned migration of the docs/preview
from **Storybook** to an **Astro + Starlight** site, using Svelte "islands" to
embed live, interactive component demos inside Markdown/MDX — a curated docs
experience that balances documentation and demos. **Deferred** (not started);
recorded here so it is reviewable. The vitest + vitest-axe suite is independent of
Storybook (it renders `*.fixture.svelte`, not stories) and is unaffected.

Four phases, designed so Astro stands up alongside Storybook first and Storybook
is removed last (no broken-docs window):

1. **Scaffold** a new `packages/docs` Astro project (`@astrojs/starlight` +
   `@astrojs/svelte`), `base: "/design-system/"`; migrate the existing `docs/*.md`
   prose into Starlight content — alongside Storybook.
2. **Live demos** via Svelte islands (`client:visible`), porting the examples from
   the 35 `*.stories.svelte`; theme-aware (light/dark) demos.
3. **Swap deploy**: replace `.github/workflows/storybook.yml` with an Astro
   build + deploy to Pages; add a per-PR CI gate (vitest + typecheck + astro
   build), which the repo currently lacks.
4. **Remove Storybook**: delete `packages/svelte/.storybook/`, the
   `*.stories.svelte`, and the `@storybook/*` / `addon-svelte-csf` devDeps. Keep
   all `*.fixture.svelte` (the test suite depends on them).

Once this lands, the "Storybook story" item in the parity bar above becomes an
Astro + Starlight live demo.
