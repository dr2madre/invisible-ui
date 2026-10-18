# 19. Tokens describe ownership, scope and property

Date: 2026-10-18

## Status

The maintainer approved the direction and clean migration. Implementation is
active on `feature/token-model-reform`. The canonical source and runtime consumers
use the new names. This record documents the approved decision, not a new
request for architecture approval.

## Context

The previous palette/style/role/component model mixed tenant choices, shared
UI decisions and component-specific values. The complete palette lived in a
demo rather than in the canonical source. Computed colour exports could preserve
appearance while losing the semantic relationships needed for retheming.

## Decision

The logical groups are:

- `colors.palette`: exact named colour families and steps.
- `colors.brand` and `colors.feedback`: tenant-configurable semantic choices.
- `metrics`: spacing, sizes, border widths, radii, opacity and density.
- `typography`: font families, sizes, weights and line heights.
- `components.general`: shared UI defaults by property and context.
- `components.<name>`: explicit overrides or aliases for one component.

A background in general applies to all inheriting components. Card background
belongs to Card only. Use background, foreground and border as property names.
No generic `container` group sits between general and its properties. Button
reads `components.button` properties, not general tokens directly. Its Default
and Ghost hover tokens both reference the shared hover background.
Do not use surface or on-primary in new logical token names. A contextual
foreground is named by its context, such as action/primary/foreground/default.
Preserve different functional contexts even when their values happen to match.

This amends the surface and on-* examples of ADR 0002, not its role/state
principle. Palette primitives retain full colour family names. Light and Dark
remain modes, never semantic names. The version-2 source places per-mode
overrides in the repository extension `com.invisible-ui.modes`; `$value` is
the default Light value. This is not standard DTCG mode support. Exporters
must resolve the extension explicitly.

Dependencies point from components to shared decisions, and from those
decisions to brand/feedback and palette. Never infer an alias by matching two
RGB values. Keep colour-mix recipes and alpha as data; browser computed colours
can verify a result but cannot replace those relationships.

The migration uses no legacy runtime aliases. Update internal consumers and
publish a mapping for external applications. No new colour, spacing or motion
values are introduced as part of the rename. The palette's exact original
values come from ColorPaletteDemo.svelte at baseline commit 21f1b047.

## Implementation boundaries

The temporary `reform.tokens.json` has been removed. `tokens.json` is the only
live source. `migration-v2.json` records old/new canonical paths and CSS names;
it does not supply runtime aliases.

Preserve the independent density axis and touch-target guarantees. Preserve
idiomatic platform APIs under ADR 0018, with explicit mappings and no redundant
old/new names. Historical documents may retain old names as historical facts.

## Verification

The preparation tests cover palette completeness, mapped values and recipes,
reference validation, cycles, types and tenant override propagation. Full
adapter builds, visual comparisons and runtime tenant checks are required
before activation is complete. No new accessibility verification is claimed.

The migration manifest and implementation report record coverage and unrun
checks. Do not refresh visual snapshots to hide unrequested appearance changes.
