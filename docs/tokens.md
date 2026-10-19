# Design tokens

`packages/tokens/tokens.json` is the canonical source for web and Flutter.
The version-2 model implements [ADR 0019](adr/0019-token-model.md).
The migration changes names and ownership, not the existing colour values.

## Groups and ownership

| Group | Responsibility |
| --- | --- |
| `colors.palette` | Named colour families, 11 steps per family, plus White/Grey 0 and Black |
| `colors.brand` | Tenant brand choices, initially aliases to the palette |
| `colors.feedback` | Info, success, warning and danger choices, initially palette aliases |
| `metrics` | Radius and density dimensions |
| `typography` | Font sizes, weights and line heights |
| `components.general` | Shared UI decisions: background, foreground, border, state, focus and contextual action/feedback colours |
| `components.<name>` | Decisions scoped to one component |

The palette contains 134 entries. Its 132 family steps come from the original
palette table at commit `21f1b047`. The palette demo reads the canonical source;
it no longer owns a second table of values.

Dependencies point from component decisions to general decisions, then to
brand/feedback or palette. Equal RGB values do not justify merging roles.
For example, a solid action foreground and a contextual action foreground
have different responsibilities even when a theme gives them the same colour.

## Background and foreground

There is no `components.general.container` group. Button owns its properties:
`components.button.background.default`, `.background.hover`,
`.foreground.default`, `.border.default`, `.radius`, `.spacing.x` and `.spacing.y`.
Variant names qualify properties, for example
`components.button.background.primary.default`.
Default and Ghost hover both alias `components.general.background.hover`.
The default Button, Toggle Button, Toggle Group and Segmented Control borders
alias `components.general.border.action`, the control border mixed 70% with the
background. A pressed Toggle Button aliases `components.general.border.selected`,
the selection colour with the same recipe.
Changing a Button token does not modify the shared token it references.

The default Button fill aliases `components.general.background.action`, which
is transparent in both themes, and its label aliases
`components.general.foreground.action`. A Toggle Button at rest points at the
same two tokens, so Toggle Group items match the default Button too. A pressed
Toggle Button and the selected Segmented Control segment alias
`components.general.background.selected` and
`components.general.foreground.selected`.

Avatar, Switch, Calendar, Table, Carousel, Navigation Bar and Stepper own their
backgrounds under `components.<name>.background.default`; these are palette
references rather than a shared synthetic container layer.

`components.general.background.default` is the shared background.
`components.card.background.default` applies only to Card. Use `background`,
`foreground` and `border`, not `surface` or `on-primary`. Context comes before
the property, for example `components.general.action.primary.foreground.default`.

In Light, page, card, dialog, popover, menu and sidebar backgrounds reference
the shared background. The secondary card and code block use Grey 50.
In Dark, page and sidebar use Black, other containers use Grey 950, and the
secondary card uses Grey 900. These explicit component choices remain distinct
from the general background.

## Primary and selected

In Dark, `colors.brand.primary.default` is Purple 500 mixed 62% with Grey 50,
`#a990dc`, and its hover is the 50% mix, `#b8a4e0`: a light primary reads on
the Black page. The label on the primary fill,
`components.general.action.primary.foreground.default`, is White in Light and
Black in Dark.

`components.general.selection.background.default` is the primary selected
colour and points at the primary action fill. Every selected, checked,
current or on part points at it, directly or through the tokens derived from
it: `components.general.selection.foreground.default` (the label on a solid
selected fill, the same as the label on the primary fill),
`components.general.background.selected`, `components.general.foreground.selected`,
`components.general.border.selected` and
`components.general.selection.contextual.foreground.default` (the selection
text colour on a tint, darker than the primary in Light).

The parts that point at it: the Tabs indicator and selected count, the
checked Checkbox and Checkbox Group fill and glyph, the checked Radio dot, the
Switch track when on and its on label, the pressed Toggle Button and Toggle
Group item, the selected Segmented Control segment, the selected Calendar,
Date Picker and Date Range Picker day and the picked date icon, the current
Pagination page, the current Navigation Menu link, the current Sidebar item,
the sorted Table column, the selected Tree View item, the selected Tag, the
Combobox and Multi Select selected option, the current Stepper step, the
filled Rating Group star, the Slider and Range Slider fill and thumb, the
focused Time Field segment and the Upload Drop Area while a file is dragged
over it.

Exceptions: links (Link, Breadcrumb, the Login Form and Upload Drop Area
actions) keep `components.general.action.secondary.body.foreground.default`,
because a link is not a selected state. The focus ring keeps
`colors.brand.secondary.default`.

The Switch thumb is White at rest. On, it sits on the selected fill and takes
the label colour on it, `components.general.selection.foreground.default`:
White in Light, Black in Dark, where White would reach only 2.72:1 on the
light track.

## Dark contrast

Dark reproduces the Light contrast of each pair below against the page
background: White in Light, Black `#121212` in Dark. Each Dark value is the
nearest palette step or a recorded mix. Ratios are WCAG 2 contrast ratios.

| Pair | Light | Dark before | Dark now |
| --- | --- | --- | --- |
| Default border on the page (`general.border.action`) | `#9e9e9e` 2.68 | `#7a7a7a` 4.36 | control border 42% with the background, `#595959` 2.67 |
| Default fill (`general.background.action`) | none | Grey 900 `#272727` 1.25 | none |
| Default and toggle label on the page (`general.foreground.action`) | Grey 900 14.94 | Grey 50 17.18 | Grey 100 `#e0e0e0` 14.19 |
| Primary fill on the page | `#7a52cc` 5.38 | `#7a52cc` 3.48 | `#a990dc` 6.88 |
| Primary label on the primary fill | White 5.38 | White 5.38 | Black 6.88 |
| Primary label on the hover fill | White on Purple 600 6.99 | 6.99 | Black on `#b8a4e0` 8.41 |
| Secondary fill on the page | `#ebe5f7` 1.23 | `#332d40` 1.42 | primary 14% with Black, `#27242e` 1.23 |
| Secondary border on the page | primary at 55% 2.60 | primary at 55% 2.30 | primary at 42% 2.60 |
| Secondary label on the page | Purple 600 6.99 | White 18.73 | `#a990dc` 6.88 |
| Secondary label on its fill | 5.68 | 13.21 | 5.59 |
| Selected fill on the page (`general.background.selected`) | selection at 10% 1.14 | selection at 10% 1.08 | selection at 10% 1.15 |
| Selected border on the page (`general.border.selected`) | 70% with the background 3.01 | 2.53 | 51%, `#695d83` 3.12 |
| Selected label on the page (`general.foreground.selected`) | `#7a52cc` 5.38 | `#7a52cc` 3.48 | `#a990dc` 6.88 |
| Selected label on the selected fill | 4.71 | 3.24 | 5.98 |
| Label on a solid selected fill (`selection.foreground`) | White 5.38 | White 5.38 | Black 6.88 |
| Switch thumb on the on track | White 5.38 | White 5.38 | Black 6.88 |

The Dark secondary fill and label, the selection text colour, the label on a
selected fill and the Dark label on the primary fill changed after the reform.
The migration manifest keeps the reform values, and
`scripts/token-model.test.mjs` lists these entries as changed on purpose.

## Modes and recipes

The file uses DTCG token values and references. The repository extension
`com.invisible-ui.modes` supplies mode overrides; it is not standard DTCG mode
support. `$value` is Light. A leaf's `dark` override replaces its value and mix
recipe. Light and Dark are not segments of public token names.

`com.invisible-ui.mix` stores an sRGB recipe with `base`, `with`, `amount` and
`space`. `amount` is the fraction of `base`. `$value` stores the resolved colour;
the recipe preserves the dependency for retheming. Alpha is retained.

`scripts/token-model.mjs` validates references, types, dependency direction and
cycles, resolves modes, and applies explicit tenant overrides. Palette overrides
are rejected. Other overrides can be literals or compatible aliases.

Keep the distinct solid and contextual feedback pairs. In particular, warning
labels use a separate fill for readable dark text. Dialog overlay retains its
alpha, the navigation current indicator retains its mix, and the data-grid
secondary background remains an independent component decision.

## Web names and overrides

A canonical path becomes `--ds-` followed by its segments separated by hyphens:

```css
:root {
  --ds-colors-brand-primary-default: var(--ds-colors-palette-cobalt-blue-500);
  --ds-components-card-background-default: var(--ds-colors-palette-grey-50);
}
```

No old canonical CSS names are retained as aliases. Use
`packages/tokens/migration-v2.json` to migrate external consumers.

The hand-authored `tokens.css` is identical across four adapters. It retains
system and explicit themes, colour-mix fallbacks, composed shadows and existing
frontend-only values. The registry distinguishes these from design-owned tokens.
Component-local CSS knobs with fallbacks are not all canonical DTCG tokens;
their inventory remains in the component token catalog. The canonical migration
does not silently promote platform-specific layout properties into shared data.

## Flutter

The generator reads the same canonical model and explicitly resolves both modes.
`InvisiblePalette` uses full family names. `InvisibleBrandColors` and
`InvisibleFeedbackColors` replace the former combined style class.
Radius, typography and density remain typed constants.

`InvisibleColors` keeps idiomatic platform field names, with exactly one
canonical source per field in `scripts/token-platform-bindings.mjs`. Generated
field comments show that path. These bindings are not legacy token aliases.
`InvisibleColorMixes` retains recipes. `InvisibleColors.copyWith` replaces
explicit fields; it does not automatically re-theme all dependent fields.

Density remains independent of Light/Dark. Compact and regular minimum targets
remain 24 logical pixels, touch targets 44. Undefined density dimensions remain
null in Flutter rather than receiving invented defaults.

## Build and verification

Run `pnpm tokens:build` for generated CSS and Dart, and `pnpm tokens:registry`
after changing runtime styles. Run `pnpm tokens:check` and `pnpm tokens:test`.

`scripts/token-runtime.test.mjs` compares every canonical token with the shipped
CSS in both modes, checks recipe identity, automatic Dark mode and adapter parity.
`scripts/token-model.test.mjs` checks the pinned migration values, complete palette,
alias graph and tenant overrides. Existing contrast tests remain separate.
These checks do not constitute manual accessibility or visual verification.
