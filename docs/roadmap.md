# Roadmap

Component build-out plan for the design system. Every component ships the same
"parity bar": a headless primitive in `@design-system/core` (when it needs
state), a Svelte adapter, a styled themeable component (`--ds-*` tokens),
`vitest` + `vitest-axe` tests, and an **Astro + Starlight docs page with a live
demo** under `packages/docs`.

> **Parity-bar update.** The docs tooling has moved from Storybook to Astro +
> Starlight (see the bottom of this file), and the per-component Storybook story
> and the single Kitchen Sink page have both been **removed**. New components
> are documented as an Astro `components/<name>.mdx` page embedding a
> `*Demo.svelte` island.

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

## Phase 4 — Form & value components ✅

No overlay dependencies — parallelizable. One PR per component (or small related
groups). Each ships the parity bar above (reuse existing primitives wherever
possible, only add core when needed).

**Status: 12 of 12 built and merged to `main`** — core + Svelte adapter
+ styled component + `vitest`/`vitest-axe` tests, all green. **Astro demos are
not yet written — see "Where to continue".**

| Component | Status | Core approach | Reuse strategy |
| --- | --- | --- | --- |
| Collapsible | ✅ | new minimal `core/collapsible` | single-item disclosure (the existing `core/accordion` is multi-panel — overkill here) |
| Aspect Ratio | ✅ | presentational, no state | pure CSS `aspect-ratio` |
| Progress | ✅ | new `core/progress` | one-way `role="progressbar"` value/range wiring |
| Meter | ✅ | new `core/meter` | `role="meter"` value/range wiring |
| Label | ✅ | minimal `core/label` | id / `for` association pattern from `core/text-field` |
| Field | ✅ | new `core/field` | reuse `core/text-field`'s id linking + smart `aria-describedby` |
| Toggle Group | ✅ | new `core/toggle-group` | roving via `core/internal/collection`; ids like `core/tabs` |
| Slider | ✅ | new `core/slider` | pointer-drag + keyboard; disabled/id pattern |
| Pagination | ✅ | reuse the `core/tabs` roving pattern | single-select roving + Home/End |
| PIN Input | ✅ | new `core/pin-input` | per-cell inputs + id linking from `core/text-field` |
| Rating Group | ✅ | **reuses `core/radio-group`** | renders items as stars in the Svelte layer (no new core) |
| Scroll Area | ✅ | new `core/scroll-area` | native DOM scroll + custom overlay scrollbars (thumb geometry from metrics) |

**Related radio additions** (beyond the original list, same branch): `RadioGroup`
gained an `orientation` prop (`vertical` default / `horizontal`), and a standalone
**`Radio`** (single radio + label on a native `<input type="radio">`, grouped by
`name`) was added for hand-laid-out radios.

### Where to continue (contributors)

All 12 Phase 4 components are built and merged. The remaining gap is
documentation: **Astro live demos are still missing** for many built components.
For each, add `packages/docs/src/content/docs/components/<name>.mdx` (frontmatter
title + a `<Preview>` embedding a `<…Demo client:visible />` island) and the
matching `packages/docs/src/demos/<Name>Demo.svelte`. Copy an existing
component's page as the template. See `docs/demos-roadmap.md` for the checklist.

Each component lives in `core/src/<name>/` (types/state/connect/index + test) and
`packages/svelte/src/lib/<name>/` (create-*, `<Name>.svelte`, fixtures, tests),
is registered in `core/src/index.ts`, `packages/svelte/src/lib/index.ts` (when it
has a `create*`) and `packages/svelte/package.json` (`files` + `exports`).

## Phase 5 — Data & presentational ✅

- Avatar Group (overlapping avatars + "+N" overflow chip) ✅
- Tag (colored chip: status + text + optional icons; may host a Count) ✅
- Count (notification number / "badge": clamps to `max` → "N+", dot mode) ✅
- Card (media vertical/horizontal, icon-instead-of-image, dashboard metric tile) ✅
- Table / Data list — split into **Table** (pure grid: columns, cells, sortable headers w/ aria-sort) ✅
  and **TableSet** (composed shell: title, column-visibility config, table/card view via segmented
  control, client-side pagination, infinite scroll w/ sentinel + load-more, and **tabs as distinct
  views** — each tab swaps the whole table to its own columns + rows) ✅
- Skeleton (loading placeholder: text/circle/rect, pulse/wave, reduced-motion aware) ✅
- Toolbar (WAI-ARIA toolbar: roving tabindex over buttons/groups) ✅
- Tree View (WAI-ARIA tree: roving tabindex, expand/collapse, keyboard nav) ✅
- Carousel (slide mode: bg-image slides w/ overlay; gallery mode: scrolling card row) ✅
- Timeline / Steps (Stepper) — ordered progress, linear gating, aria-current ✅

### Typography / prose primitives

- Code (inline `<code>`) ✅
- CodeBlock (block `<pre><code>` with language caption + copy button) ✅
- Blockquote (`<blockquote>` with optional attribution) ✅

## Phase 6 — Date & time ✅

- Calendar — headless date-grid core (`@design-system/core` `calendar`) + styled
  `Calendar.svelte`. Month view: keyboard grid (arrows/Home/End/PageUp-Down),
  roving tabindex, selection, today, min/max, **appointment dots** + **per-day
  prices**, `day` slot, localised labels. Views: month, **two-month** (side by
  side), **week/three-day/day** (day-column agendas), and **year** (12 simplified
  mini-months, stacked), with a built-in view switcher. ✅
- Date Picker — readonly combobox field that opens the `Calendar` in a popover;
  pick fills + closes, Intl-formatted display, min/max, clearable, dots/prices
  forwarded. ✅
- Date Range Picker — range field that opens a `Calendar` in `mode="range"`
  (start → end, banded between, closes when complete); two-month by default. ✅
- Time Field — segmented spinbutton input (hour/minute, optional seconds,
  12/24h with AM·PM); arrows increment/decrement (wrapping), digit entry with
  auto-advance, Backspace clears; ISO `HH:mm[:ss]` value. ✅

**Phase 6 complete.**

---

## Docs tooling — Storybook → Astro + Starlight ✅

Separate track from the component build-out, now **complete**: the docs/preview
moved from Storybook to an **Astro + Starlight** site (`packages/docs`) using
Svelte "islands" to embed live, interactive demos inside MDX. Shipped across four
PRs (#58 scaffold, #59–#60 live demos, #61 deploy + per-PR CI gate, #62 Storybook
removal). The `vitest` + `vitest-axe` suite is independent of the docs (it renders
`*.fixture.svelte`) and was unaffected.

What this means for new work:

- Document each component with an Astro `components/<name>.mdx` page + a
  `*Demo.svelte` island under `packages/docs/src/demos/` (not a Storybook story).
- Storybook is gone: no `.storybook/`, no `*.stories.svelte`, no `@storybook/*`
  devDeps. The single Kitchen Sink page was removed too.
- `*.fixture.svelte` files remain — the test suite depends on them.
