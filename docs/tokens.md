# Design tokens — canonical model & interop

Tokens follow a **canonical, technology-agnostic model**; each stack realizes it
in its own vocabulary. The design-owned tiers live in a single machine-readable
source, **`packages/tokens/tokens.json`** (W3C **DTCG** format), and
**Style Dictionary** generates platform outputs from it. `packages/tokens` is a
plain folder, outside the pnpm workspace: it holds data, no code, and nothing
installs it. Apps that read the file directly, such as Markdown Funk, point at
this path.

## Tiers (ownership)

1. **Primitive** — the raw palette/scale (`palette.blue.600`, `palette.grey.0…950`).
   _Design-owned._
2. **Semantic (`style`)** — design decisions that reference primitives; the
   brand contract, with interaction **status** in the name
   (`style.primary.default`, `style.primary.hover`, `style.danger.hover`).
   _Design-owned._
3. **Component** — binds component properties to semantic tokens, never to raw
   values; aliases the native role vocabulary when a stack mandates one
   (Material/Carbon). _Frontend-owned_ — for this Svelte stack it's the
   "free" CSS layer (`tokens.css` + the `--ds-*` component tokens).

The design source also holds the values the components read, so a platform
without CSS (the Flutter adapter, ADR 0017)
gets the same theme from the same file:

| Group | Holds | Becomes in `tokens.css` |
| --- | --- | --- |
| `radius` | Corner radii by shape role. | `radius.control` is `--ds-radius-control` |
| `role.light`, `role.dark` | The colour roles for each theme: surfaces, text, borders, states, status tints, the focus ring and halo, selection. | `role.dark.color-text` is `--ds-color-text` in the dark theme |
| `focus` | Focus ring width, offset and halo width. | `focus.ring-width` is `--ds-focus-ring-width` |
| `typography` | Line heights, heading weight, heading sizes. | `typography.font-size-h1` is `--ds-font-size-h1` |
| `density.compact`, `density.regular`, `density.touch` | Control sizing per density level, and the minimum target size. | `density.regular.control-padding-x` is `--ds-control-padding-x`, `density.regular.min-target-size` is `--ds-min-target-size` |

- **Roles.** A role that `tokens.css` points at another token keeps the
  reference (`{palette.grey.900}`, `{style.danger.hover}`). A role that
  `tokens.css` builds with `color-mix()` holds the computed sRGB value to the
  nearest 8-bit channel, because DTCG has no colour mixing, and carries the mix
  itself as a recipe (see [Mix recipes](#mix-recipes)). A translucent role
  (`state-hover`, `color-focus-halo`) uses the DTCG colour object, which keeps
  the exact alpha. The dark focus ring is `{style.focus.onDark}`.
- **Density.** `regular` is the default and holds the values the web renders
  today. `min-target-size` is the side of the smallest square hit area a
  control keeps, whatever its painted size: 24 under `compact` and `regular`
  (WCAG 2.5.8), 44 under `touch`. `compact` and `touch` hold only that value
  for now: no other compact or touch size has been decided. The stylesheet
  renders the regular level only: `--ds-min-target-size` is the regular
  value, 24px, and the compact and touch levels have no `--ds-*` property
  and no per-density selector. Components still write their own 24px
  minimum; the property is there for consumer styles to read.

## Mix recipes

Each colour that `tokens.css` builds with `color-mix()` keeps the resolved
colour in `$value` and the mix it comes from under `$extensions`, with the
key `com.invisible-ui.mix`. That covers the mixed roles of `role.light` and
`role.dark` and `style.focus.onDark`:

```json
"color-info-surface": {
  "$value": "#f0f3f9",
  "$extensions": {
    "com.invisible-ui.mix": {
      "space": "srgb",
      "base": "{style.info.default}",
      "amount": 0.08,
      "with": "{palette.grey.0}"
    }
  }
}
```

The fields read in the order of the CSS: `color-mix(in srgb,
var(--ds-feedback-info) 8%, var(--ds-neutral-0))`.

| Field | Holds |
| --- | --- |
| `space` | The colour space of the mix. Every recipe today is `srgb`. |
| `base` | The first colour, as a token reference. |
| `amount` | The share of `base` in the mix, from 0 to 1. `with` takes the rest. |
| `with` | The second colour: a token reference, or `transparent` (the focus halo). |

A reference names the token the stylesheet reads. A role that `tokens.css`
mixes from another role points at that role in the same theme
(`{role.dark.color-secondary}`); one that mixes a brand, feedback or neutral
primitive points at `style` or `palette`.

The recipe is there so a platform without `color-mix()` can recolour its
tints. The Flutter adapter (ADR 0017) builds its theme from the resolved
values; an app that overrides a brand or feedback colour recomputes each
role whose recipe reads that colour, as the stylesheet does at runtime.
To recompute, mix each channel in sRGB with premultiplied alpha, then round
to the nearest 8-bit value. The parity test does this for every recipe and
checks the result against `$value` and against `tokens.css`.

## Naming grammar

```
--[domain]-[component]-[variant]-[status]--[property]
```

Domain optional; component generic (`style`) or specific; variant/status
optional; property after a double dash. Canonical states:
`default · hover · active · focus · disabled · selected`.

## Source of truth & build

- Edit **`packages/tokens/tokens.json`** first. It exports everywhere.
- Generate CSS variables (and, later, SCSS/Swift/Kotlin/Dart) with:

  ```sh
  pnpm --filter @design-system/svelte tokens:build
  ```

  → `packages/svelte/dist/tokens/tokens.generated.css`
  (`--ds-style-primary-default`, `--ds-palette-blue-600`, …).

- A **parity test** (`packages/svelte/src/lib/styles/tokens-parity.test.ts`)
  resolves every token in the source, works out the value `tokens.css` gives
  the same property in the same theme (following `var()` and doing the
  `color-mix()` arithmetic), and asserts the two are equal. It also fails when
  the stylesheet gains a colour role the source lacks.
- The token registry (`pnpm tokens:check`) fails when a token in the source
  has no property in the stylesheet, except the compact and touch density
  levels. It leaves the mix recipes out: its entries already carry the
  stylesheet's `color-mix()` expressions.

## Why the runtime stays in `tokens.css`

The stylesheet is hand-authored and ships as it is in all four adapters. It
keeps what CSS can do at runtime and DTCG cannot express: light and dark
remapping through `prefers-color-scheme` and `[data-theme]`, tinted surfaces
mixed from the feedback hue with `color-mix()` (so a brand or feedback
override recolours its tints), the fallback for engines without `color-mix()`,
the composed focus shadow and the elevation shadows. The source holds the
resolved values of the same roles and their mix recipes, and the parity test
keeps the two equal.
