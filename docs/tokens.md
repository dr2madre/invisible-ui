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
| `role.light`, `role.dark` | The colour roles for each theme: surfaces, text, borders, states, status tints, the focus ring and halo, selection, the dialog overlay. | `role.dark.color-text` is `--ds-color-text` in the dark theme, `role.dark.dialog-overlay` is `--ds-dialog-overlay` |
| `focus` | Focus ring width, offset and halo width. | `focus.ring-width` is `--ds-focus-ring-width` |
| `typography` | Line heights, heading weight, heading sizes. | `typography.font-size-h1` is `--ds-font-size-h1` |
| `density.compact`, `density.regular`, `density.touch` | Control sizing per density level, and the minimum target size. | `density.regular.control-padding-x` is `--ds-control-padding-x`, `density.regular.min-target-size` is `--ds-min-target-size`, `density.touch.min-target-size` is `--ds-min-target-size-touch` |

- **Roles.** A role that `tokens.css` points at another token keeps the
  reference (`{palette.grey.900}`, `{style.danger.hover}`). A role that
  `tokens.css` builds with `color-mix()` holds the computed sRGB value to the
  nearest 8-bit channel, because DTCG has no colour mixing, and carries the mix
  itself as a recipe (see [Mix recipes](#mix-recipes)). A translucent role
  (`state-hover`, `color-focus-halo`) uses the DTCG colour object, which keeps
  the exact alpha. The dark focus ring is a role like the light one:
  `role.dark.color-focus-ring` holds `#a286db` and its mix (ADR 0002: the
  theme, not the token name, says it is dark).
- **Density.** `regular` is the default and holds the values the web renders
  today. `min-target-size` is the side of the smallest square hit area a
  control keeps, whatever its painted size: 24 under `compact` and `regular`
  (WCAG 2.5.8), 44 under `touch`. `compact` and `touch` hold only that value
  for now: no other compact or touch size has been decided. The stylesheet
  renders the regular level, `--ds-min-target-size` (24px), and the touch
  target, `--ds-min-target-size-touch` (44px), with no per-density selector.
  The component sheets read the touch target under
  `@media (pointer: coarse)`: menu items, context menu items and menubar
  triggers keep at least 44 by 44 there. Components still write their own
  24px minimum; `--ds-min-target-size` is there for consumer styles to read.
- **Visual density never reduces the touch target.** A density level
  changes how tight controls look, never the hit area: a coarse pointer
  keeps 44 by 44 on the web, and the Flutter theme never lowers
  `minTargetSize` below the level's token.

## Mix recipes

Each colour that `tokens.css` builds with `color-mix()` keeps the resolved
colour in `$value` and the mix it comes from under `$extensions`, with the
key `com.invisible-ui.mix`. That covers the mixed roles of `role.light` and
`role.dark`, the dark focus ring included:

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

## Status label fills

Solid Tag and Count put a text label on a status fill, so the pair is a text
pair: 4.5:1 (WCAG 1.4.3). White on the info, success, danger and neutral
colours clears it. The warning colour, `#c96422`, gives the dark
`color-on-warning` 3.9:1 only, and no palette colour reaches 4.5:1 on it. So
the warning label has its own fill, `color-warning-label-surface`: the
warning colour mixed 85% with white, `#d17b43`, on which `color-on-warning`
measures 4.86:1 in both themes. The warning colour stays as it is for
glyphs, dots and meter fills, which need 3:1. Without `color-mix()` the fill
falls back to `--ds-neutral-100` (11.75:1), and the label's text still names
the status.

## Dialog overlay

`dialog-overlay` is the scrim between a modal dialog and the page below. It
is a role of each theme, `role.light.dialog-overlay` and
`role.dark.dialog-overlay`, as `light` and `dark` name themes, never tokens
(ADR 0002). It is `--ds-dialog-overlay` in the stylesheet, which every dialog sheet reads for
its `::backdrop`, and `InvisibleThemeData.dialogOverlay` in Flutter.

| Theme | Overlay | Dimmed page | Dialog surface against the dimmed page | Dialog border against the dimmed page |
| --- | --- | --- | --- | --- |
| Light | `rgb(28 25 21 / 0.5)` | `#8e8c8a` | 3.35:1 | 1.87:1 |
| Dark | `rgb(0 0 0 / 0.6)` | `#100e0d` | 1.25:1 | 1.76:1 |

The dimmed page is the page background with the overlay on top; the dialog
surface is `color-background` and its border `color-border`. Before the
dark value, the dark theme used the light overlay, which left 1.07:1 between
the dialog and the dimmed page. How far the overlay sets the dialog apart is
a theme choice, not an accessibility requirement: the dialog is modal, and
its name, focus and inert background do not depend on the overlay.

## Navigation bar current indicator

`navigation-bar-current-indicator` is the shape behind the current
destination's icon in a Navigation Bar (`docs/navigation-bar-spec.md`). It is
a role of each theme, `--ds-navigation-bar-current-indicator` in the
stylesheet and `InvisibleColors.navigationBarCurrentIndicator` in Flutter.
The icon on it is drawn in `color-text`, so the role has to reach 3:1 against
both the surface and the text (WCAG 1.4.11): the shape marks the current
destination, and the icon stays readable on it.

| Theme | Recipe | Value | Against `color-surface` | Against `color-text` |
| --- | --- | --- | --- | --- |
| Light | `color-secondary` 90% with `neutral-0` | `#8763d1` | 3.38:1 | 3.47:1 |
| Dark | `color-secondary` 75% with `neutral-50` | `#997ad5` | 3.17:1 | 3.08:1 |

Without `color-mix()` the light theme falls back to `neutral-400` (3.75:1 and
3.13:1) and the dark theme to `neutral-300`, which keeps the shape at 4.30:1
against the surface. The bar's other colours are component tokens that fall
back to existing roles; width, radius, shadow and position are the
application's and have no token.

## Data grid secondary emphasis

`grid-cell-secondary-surface` is the surface of a data grid cell with the
secondary emphasis: a cell that is allowed but outside the usual schedule,
such as a weekend in a timesheet (`docs/editable-grid-spec.md`). It is a
role of each theme, `--ds-grid-cell-secondary-surface` in the stylesheet and
`InvisibleColors.gridCellSecondarySurface` in Flutter. The surface adds to
the cell's visible secondary label and never replaces it, so it needs no
contrast against the plain cell; the text drawn on it needs 4.5:1.

| Theme | Value | `color-text` | `color-text-secondary` | `color-danger-text` |
| --- | --- | --- | --- | --- |
| Light | `neutral-50`, `#f4f2ef` | 13.78:1 | 7.59:1 | 7.81:1 |
| Dark | `neutral-800`, `#332f2a` | 11.89:1 | 7.43:1 | 5.78:1 |

An application that styles its own variants apart, such as holidays and
weekends, maps them onto this role in its theme.

## Naming grammar

```
--[domain]-[component]-[variant]-[status]--[property]
```

Domain optional; component generic (`style`) or specific; variant/status
optional; property after a double dash. Canonical states:
`default · hover · active · focus · disabled · selected`.

## Source of truth & build

- Edit **`packages/tokens/tokens.json`** first. It exports everywhere.
- Generate CSS variables and the Dart tokens with:

  ```sh
  pnpm tokens:build
  ```

  → `packages/svelte/dist/tokens/tokens.generated.css`
  (`--ds-style-primary-default`, `--ds-palette-blue-600`, …), and
  `packages/flutter/lib/src/tokens/tokens.g.dart`: typed constants for the
  palette, the style tier, the radii, the focus ring, the type scale and the
  density levels, the roles as a light and a dark `InvisibleColors`, and the
  mix recipes as `InvisibleColorMixes`. The Dart format is
  `scripts/tokens-dart-format.mjs`. The Dart file is committed, because a git
  consumer of the Flutter package runs no build step, and
  `pnpm tokens:check` fails when it differs from what the source produces.
  A density level that leaves a size undefined holds null there.

- A **parity test** (`packages/svelte/src/lib/styles/tokens-parity.test.ts`)
  resolves every token in the source, works out the value `tokens.css` gives
  the same property in the same theme (following `var()` and doing the
  `color-mix()` arithmetic), and asserts the two are equal. It also fails when
  the stylesheet gains a colour role the source lacks.
- The token registry (`pnpm tokens:check`) fails when a token in the source
  has no property in the stylesheet, except the density sizes the
  stylesheet does not render (the compact level). It leaves the mix recipes out: its entries already carry the
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
