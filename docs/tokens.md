# Design tokens — canonical model & interop

Tokens follow a **canonical, technology-agnostic model**; each stack realizes it
in its own vocabulary. The design-owned tiers live in a single machine-readable
source, **`packages/svelte/tokens/tokens.json`** (W3C **DTCG** format), and
**Style Dictionary** generates platform outputs from it.

> This is the first slice (palette + the semantic `style` tier). It's a proposal
> aligned to the canonical convention — review and extend the structure freely.

## Tiers (ownership)

1. **Primitive** — the raw palette/scale (`palette.blue.600`, `palette.grey.0…950`).
   _Design-owned._
2. **Semantic (`style`)** — design decisions that reference primitives; the
   brand contract, with interaction **status** in the name
   (`style.primary.default`, `style.primary.hover`, `style.danger.hover`).
   _Design-owned._
3. **Component** — binds component properties to semantic tokens, never to raw
   values; aliases the native role vocabulary when a stack mandates one
   (shadcn/Material/Carbon). _Frontend-owned_ — for this Svelte stack it's the
   "free" CSS layer (`tokens.css` + the `--ds-color-*` roles components consume).

## Naming grammar

```
--[domain]-[component]-[variant]-[status]--[property]
```

Domain optional; component generic (`style`) or specific; variant/status
optional; property after a double dash. Canonical states:
`default · hover · active · focus · disabled · selected`.

## Source of truth & build

- Edit **`tokens.json`** only (palette + `style`). It exports everywhere.
- Generate CSS variables (and, later, SCSS/Swift/Kotlin/Dart) with:

  ```sh
  pnpm --filter @design-system/svelte tokens:build
  ```

  → `packages/svelte/dist/tokens/tokens.generated.css`
  (`--ds-style-primary-default`, `--ds-palette-blue-600`, …).

- A **parity test** (`tokens-parity.test.ts`) asserts the DTCG values match the
  live runtime values in `tokens.css`, so the source and the stylesheet can't
  drift.

## Why the runtime stays in `tokens.css`

The semantic **roles** components consume (`--ds-color-surface`, `…-text`, the
tinted `color-mix` surfaces, light/dark remapping via `prefers-color-scheme` /
`[data-theme]`) are dynamic and theme-dependent — not expressible in static
DTCG. They remain in `tokens.css` (the component/CSS layer) and reference the
primitives. Multi-theme sets (e.g. Tokens Studio themes) can later move that
remapping into the source too.
