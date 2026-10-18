# Token reform: implementation specification and decision record

Date: 2026-10-18

## Current execution status

### Pull request and verification

The reform was squash-merged into `main` in
[PR #493](https://github.com/dr2madre/invisible-ui/pull/493) as `f2943333`.
The final CI run passed the general gate, all three browser E2E jobs, Flutter
stable, Flutter 3.35 with golden images, and parity drift. The Default Button
hover intentionally matches Ghost hover; no golden images were changed.

Earlier CI runs found the following issues, all corrected before the merge.
The first CI run passed the main verification job, Firefox and WebKit. It found
five Dart formatting differences, a stale Flutter parity checklist set, one
Flutter inverted-notification close-glyph color regression and a token-catalog
contrast failure in Chromium. The two flaky Chromium component tests passed on
retry. This follow-up formats the Dart files, restores the close-glyph color,
and makes the catalog value chips transparent in both themes. The targeted
Flutter notification test passes locally. Dart formatting now passes with no
changes. The 59 affected Flutter parity checklists now reference `5df411f6`;
the source review found token styling changes, with only token-name comments
outside Svelte style blocks. The parity-drift check passes for all 80
checklists. The complete Chromium catalog accessibility sweep passes locally
(2 tests), as do the rebuilt site and Astro documentation check (zero errors,
warnings or hints).

The second CI run passed Flutter stable, Chromium, Firefox and parity drift,
but Flutter 3.35 golden comparison found subpixel border differences in Button,
Card and Dialog. The six failures share Button borders: the token generator had
rounded mixed Button colors to eight-bit channels before Flutter painted them.
The generator now keeps the source's fractional channels for Button mixes;
other roles retain their existing representation. The generated-file check,
Dart formatter, token tests and notification tests pass locally. The pinned
Flutter 3.35 golden comparison passed in the third CI run; golden images were
not updated. That run's general gate stopped at Prettier formatting for the
generator. The formatting correction passed in the final CI run.

The historical progress notes below describe earlier stages. Their statements
about an uncommitted local candidate and old CSS overrides are superseded by
the merged implementation and final CI status.

### Activation update

### Component ownership correction

The maintainer rejected the synthetic `components.general.container` group.
It has been removed from the active source and runtime. Its used backgrounds
are now owned by Avatar, Switch, Calendar, Table, Carousel, Navigation Bar and
Stepper; the unused generic opaque hover was removed. Historical migration
entries are marked retired and are not runtime aliases.

Button reads `components.button.background`, `foreground`, `border`, `radius`,
`spacing`, `typography` and `opacity`. Variants qualify the property, for example
`components.button.background.primary.default`. Default and Ghost hover both
alias `components.general.background.hover`. Old `--ds-button-*` overrides
were removed, not retained as fallbacks. ButtonGroup remains its own component.
Flutter reads the generated Button fields and dimensions. General background
and Card are unaffected by a Button-only override, covered by automated tests.

Verification for this correction: web/demo build, 98 Flutter tests including
Light/Dark Default/Ghost mouse hover and unchanged border, 134 script tests,
full workspace tests (Core 2372, React 1519, Vue 1513, Elements 1372, Svelte
1707 passed with 3 skipped), lint and typecheck. Documentation reports zero
errors and warnings. API manifests/report, token registry and evidence register
checks pass. Browser visual comparison has not been run.
No visual-baseline update was made for this correction.

Follow-up: the maintainer identified that Default Button still used the
container background on hover. Its fallback now uses
`components.general.background.hover`, the same as Ghost, in all four web
adapters. Flutter standard Button now uses `stateHover`, as Ghost does.
Border and foreground are unchanged. The existing explicit web override
`--ds-button-bg-hover` remains available. Five source-level regression checks
pass in `scripts/button-hover.test.mjs`; this is not a browser visual check.

The version-2 model is now active locally on `feature/token-model-reform`.
`packages/tokens/tokens.json` contains 230 logical tokens, including the 134
palette entries. The temporary candidate has been removed. Web consumers and
Flutter generation use the canonical source; the palette demo reads it directly.
The migration manifest records the removed canonical CSS names, without runtime
aliases. Documentation and the generated registry have been updated.

Checks completed: web library/demo build, workspace typecheck, Flutter analyze,
78 targeted Flutter tests (tokens, theme, Button, Card), 94 Svelte token/contrast
tests, and 126 script tests. The full workspace test run passed: Core 2372,
React 1519, Vue 1513, Elements 1372, Svelte 1707 passed and 3 skipped.
Lint, the documentation check (zero errors/warnings), API manifests/report,
the evidence register and token registry checks also passed. The final web/demo
build passed. Whitespace-sensitive stylesheet tests now allow formatting changes
without weakening their property or focus-ring assertions.
Visual comparison and manual assistive-technology checks have not been run.

Scope boundaries: existing frontend-only component CSS knobs and composed
shadows remain platform-owned. Flutter field bindings retain idiomatic names;
`InvisibleColors.copyWith` remains an explicit field replacement, not a
dependency-aware tenant resolver. Do not describe these boundaries as completed
canonical coverage or automatic runtime retheming. No commit, push or merge.

The preparation status below is historical and superseded by this update.

Updated after the user's instruction to start on 2026-10-18:

- PR #490 is merged. The working branch is `feature/token-model-reform`, based
  on main commit `21f1b047` (including #488, #491 and #492).
- The user identified the complete palette source: the `hues` table in
  `packages/docs/src/demos/ColorPaletteDemo.svelte`. It contains the exact 132
  values, so palette reconstruction is no longer blocked. White/Grey 0 and
  Black bring the prepared palette to 134 entries.
- A version-2 candidate is prepared in `packages/tokens/reform.tokens.json`:
  230 logical tokens, with per-mode overrides rather than theme name segments.
- `packages/tokens/migration-v2.json` accounts for all 183 old canonical leaves,
  including their Light/Dark occurrences, original values, rewritten references
  and old/new CSS names. It is not yet an inventory of every CSS-only component
  override, runtime API or consumer.
- `scripts/token-model.mjs` implements traversal, mode selection, graph checks,
  alias resolution, mix recipes and validated overrides. Seven preparation
  tests pass; ESLint passes for the four new scripts.
- ADR 0019 records the approved architecture and the in-progress status.
- The candidate is NOT the active source. Runtime adapters and the demo still
  consume their existing contract. The reform is not complete and must not be
  published as complete. No commit, push or merge has been performed.
- Remaining integration: inventory CSS-only properties and consumers; activate
  the new canonical source atomically with web/Flutter generators and consumers;
  make the palette demo read the canonical data; regenerate registries and
  documentation; run adapter builds, runtime override checks and visual checks;
  remove the temporary candidate after activation.
- Existing `report/` files and `output/` artifacts have not been removed.

The following handoff sections retain historical observations. This execution
status supersedes their previous wait-for-merge and missing-palette statements.

## Initial status

The user approved a reform of Invisible UI's token model, not a Figma-only
reorganisation. Implementation has not started. Claude is still merging
related changes. Wait for the user's confirmation, then fetch and inspect
the latest main before making migration changes.

This report records the conversation's decisions. The implementation must
also update the authoritative design documentation and record an ADR.

## Agreed structure

- `colors/palette`: primitive colours, with the full family names, such as
  `alizarin-red`. Use `palette`, not `primitives`, as the colour group name.
- `colors/brand`: tenant-configurable brand colours, which can reference palette.
- `colors/feedback`: tenant-configurable info, success, warning and danger
  colours, which can reference palette. Do not use `functional` as a synonym.
- `metrics`: measurements, including spacing, radius and border width.
  Do not use `numbers` as the group label.
- `typography`: a separate group for font family, size, weight and line height.
- Shared UI properties and component-specific properties form the next levels.
  Components reference shared decisions instead of duplicating literal values.

## Scope and naming

A background without component qualification applies generally throughout the
UI. `card/background` applies only to Card. A component uses the general
decision unless it has its own specific definition. Apply the same rule to
foreground, border and the other applicable properties.

Use `foreground`, not `on-primary`. A variant supplies the context, for example
`components/button/primary/foreground/default`.

Use `background`, not `surface`, in the new token nomenclature. Preserve
distinct functional uses during migration rather than collapsing different
values merely because their old names contain surface.

The old `style` and `role` group names do not belong in the new model. Place
focus colours and measurements with their appropriate shared or component
properties rather than retaining an unexplained standalone focus group.

Use `components/general` for shared UI properties, following the user's initial
tree and subsequent clarification of general scope. Resolve technical path
details consistently with that model without requesting approval again. Do not
invent new values or scales for categories such as opacity, density or motion.

## Palette

The target reference contains 12 families with 11 steps each (50, 100, 200,
300, 400, 500, 600, 700, 800, 900, 950): Magenta Pink, Alizarin Red, Burnt
Orange, Naples Yellow, Lime Green, Sap Green, Viridian Green, Cerulean Blue,
Cobalt Blue, Dioxazine Purple, Grey and Warm Grey.

Use the exact original values, not estimates from screenshots. Preserve
Grey 0 and any additional approved colours introduced by Claude. Completing
the palette must not silently recolour existing semantic or component uses.

At the last inspection, the local source contained only 19 palette tokens.
Claude's branch `feat/component-background-tokens`, commit `12f1ca32`, added
Black `#121212` and component backgrounds, not the full 132-colour palette.
That observation predates the ongoing merges and must be checked again.

## Migration policy

The user explicitly chose a clean migration without deprecated aliases.
Update all internal consumers, generators, documentation and tests. Timelog
is an external consumer and will migrate separately; do not modify it.

Preserve approved appearance and behaviour unless a change is explicitly
requested. Preserve tenant overrides, theme-dependent values and semantic
relationships. Keep primitive values separate from semantic references.

## Figma findings and boundaries

The existing exporter included the palette tokens present in the source.
The 18 linked swatches in the supplied palette grid matched those available
steps; Grey 0 was outside the grid. Missing swatches were absent in the source,
not dropped by that export.

The component pilot creates 45 derived Button colour variables from browser
computed values. Those literal RGBA values preserve the captured appearance
but lose the source alias relationships. Updating a brand variable in Figma
does not propagate through these literals. Browser comparison is a verification
mechanism, not a replacement for semantic references.

Reform the canonical model first. Adapt export consumers as required for the
new contract; do not implement a separate Figma-only taxonomy. Preserve mix
recipes and alpha where a simple alias cannot describe a derived value. Do
not infer semantic aliases solely from equal RGB values.

## Existing approved Button decisions

- Example labels follow technical variants: Default, Primary, Secondary,
  Ghost and Danger. Do not replace Default with Button.
- Default hover uses the same background as Ghost hover in both themes.
  Default retains its own text and border.
- The component-specific hover override remains available.

## Verification and next actions

1. Wait until the user confirms Claude has finished merging.
2. Fetch main, inspect the resulting palette and component backgrounds, and
   preserve unrelated local files, including existing reports.
3. Resolve technical path details and document the migration in an ADR and
   the design docs before broad edits.
4. Update canonical tokens and internal consumers across all adapters, retaining
   aliases and derivation recipes in the new model, but no legacy-name aliases.
5. Regenerate outputs and test reference resolution, cycles, palette coverage,
   theme parity, tenant overrides and unchanged intended appearance.
6. Report actual checks separately from untested live Figma and accessibility
   verification. Do not update visual snapshots without approval.

PR #485 contains the preceding Figma export work. Its last checked state was
open with checks pending; do not assume it merged. Recheck its status before
integrating related work. The new token reform has no commit, push or merge
authorisation implied by the earlier request to merge that PR.

## Implementation specification

### Authority and approval boundary

The user has already approved this reform and its implementation. Do not ask
for approval of the same architecture again. Confirmed decisions include
colors/palette, brand, feedback, metrics, separate typography, shared and
component-specific properties, foreground without on-* names, background
without surface names, and a clean migration without legacy aliases.

The implementer owns technical details consistent with those decisions,
including storage, platform names and reference resolution. Ask the user only
when a choice changes the requested behaviour, appearance, scope or result.
Record the approved reform in an ADR, explicitly amending the naming examples
and theme storage described in ADR 0002; this is documentation of the approved
direction, not a new approval gate for the same decision.

The migration changes organisation and references, not the design. The baseline
is the main commit after Claude's merges, not the older checkout used to prepare
this report. Record that commit SHA in the implementation report.

### Deliverables

1. A canonical token model with typed values, semantic aliases and derivation
   recipes, plus an explicit schema version.
2. A migration manifest containing every old token and public platform name,
   its replacement, type, consumers and reason for any split or removal.
3. Updated web and Flutter consumers, theme configuration, generators, demos,
   documentation and tests. Core remains free of visual decisions.
4. Regenerated token exports and registries. Export tools consume the model;
   they do not define a parallel model.
5. An ADR, migration guide and verification report with commands and outcomes.

The manifest is migration documentation, not a runtime compatibility layer.
There are no deprecated token aliases or fallback chains to legacy names.

### Proposed logical namespace

Paths use lower-case kebab-case segments. Dots identify references in the
canonical data; slashes show the same hierarchy in documentation and Figma.
Themes and tenants are configuration axes, not token-name segments.

```text
colors/
  palette/<family>/<step>
  palette/black
  brand/<primary|secondary>/<default|hover>
  feedback/<info|success|warning|danger>/<state>
metrics/
  spacing/<existing-scale-entry>
  radius/<control|container|pill>
  border-width/<existing-scale-entry>
  size/<existing-scale-entry>
  opacity/<existing-purpose>
  density/<compact|regular|touch>/<measurement>
typography/
  font-family/<purpose>
  font-size/<purpose>
  font-weight/<purpose>
  line-height/<purpose>
components/
  general/
    background/<default|hover|pressed|disabled>
    foreground/<default|secondary|disabled>
    border/<default|control>
    focus/ring/<color|width|offset>
    focus/halo/<color|width>
    <semantic-context>/<background|foreground|border>/<state>
  <component>/
    <property>/<state>
    <variant>/<property>/<state>
    <part>/<property>/<state>
```

This proposal retains `general` from the user's original tree. Thus
`components/general/background/default` is the unqualified UI background;
`components/card/background/default` affects only Card. An application can
override the latter without recolouring other components.

`primary` and `secondary` under brand identify tenant colour choices. They do
not imply that every component's secondary variant uses a solid secondary
brand fill. `foreground` identifies text and icons in the surrounding context;
never introduce an `on-*` token. Component-specific text/icon separation is
allowed only where their actual requirements differ.

Only create leaves with existing values or an approved design requirement.
The tree is not an instruction to create every possible state combination.
Do not invent focus backgrounds, new spacing scales or unused pressed states.
`focus` normally changes its indicator, not the background.

In a component manifest declare which segments are parts and which are variants,
so a consumer does not have to guess from a path. Preserve existing technical
variant names, including Button `danger`, independently of example labels.

### Dependency and value rules

- Palette leaves hold the exact approved colour values. Palette does not depend
  on semantic or component tokens and does not change when a tenant changes.
- Brand and feedback defaults reference palette. Tenant overrides can select
  another palette entry or provide an explicit typed colour; do not require a
  tenant colour to be added to the distributed palette.
- General UI tokens reference palette, brand, feedback, metrics or typography,
  or derive a value from those dependencies. They never reference components.
- Component tokens reference general tokens or shared measurements/type tokens.
  A component-specific exception is an explicit semantic alias or recipe, with
  its reason recorded. Do not duplicate a raw colour for convenience.
- Component A must not depend on component B's private tokens. Extract a shared
  decision when both need the same semantic behaviour.
- Reject missing references, cycles and incompatible types. Equal resolved
  values do not imply equal meaning and must not be automatically deduplicated.
- No implicit inheritance is assumed in JSON. Materialise explicit aliases for
  the properties a component exposes; platform fallback syntax is generated
  from that declared relationship.

For example, Button Default hover and Ghost hover both reference
`components/general/background/hover`. Default's border and foreground retain
their own aliases. A primary Button background references the shared primary
action background, which references brand primary. Its foreground references
the corresponding shared foreground, not a name containing `on-primary`.

### Source representation, themes and tenants

Proposed storage keeps `packages/tokens/tokens.json` as the entry point, with
`$extensions` identifying schema version and theme overrides. Every leaf has
a base `$value` (the Light default); a documented repository extension stores
the Dark replacement value or recipe when different. References use the same
logical paths in both modes. An ordinary DTCG consumer reads the base values;
theme-aware exporters must explicitly resolve the extension. Do not label this
extension as standard DTCG mode support.

The exact extension schema must be committed and validated with tests before
conversion. Separate per-theme source files are a technical alternative: choose
and document one coherent representation, without requesting renewed approval
unless it changes the requested result.

Resolution order is: select density, select Light/Dark values, apply tenant
semantic overrides, apply explicit application/component overrides, then resolve
aliases and recipes. Later overrides win only at the same logical path. A
component override intentionally disconnects that property from its general
default; sibling components still follow the general token.

Provide two tenant tests, one with a palette alias and one with a literal brand
colour. Neither tenant may mutate the palette. Tenant data remains data, never
CSS source, markup or executable code. Validate values before generating output.

### Derived values and transparency

Keep existing mix amounts, colour spaces, alpha and rounding rules. Rewrite
recipe references to the new paths without changing results. A derived token
must carry its dependencies and recipe, not just a captured RGBA value.

Web adapters use runtime references and recipes so tenant overrides propagate.
Flutter resolves the same graph when constructing its theme. A platform that
cannot evaluate a recipe must export a computed value with provenance and state
that it requires regeneration after dependency changes. Never claim such a
value remains a live alias. Do not approximate a derived value by the nearest
palette step.

Distinguish colour alpha from whole-component opacity. Disabled Button opacity
is not a reason to replace all its foreground/background aliases with new colours.
Keep a transparent paint distinct from an absent paint where rendering differs.

### Migration mapping rules

The following table specifies the initial conversion. `T` denotes a theme;
`S` a state. Expand these rules into an exhaustive manifest against post-merge
main. Any old leaf not covered blocks migration completion.

| Existing source path | Proposed destination or required action |
| --- | --- |
| `palette.purple.*` | `colors.palette.dioxazine-purple.*` |
| `palette.red.*` | `colors.palette.alizarin-red.*` |
| `palette.orange.*` | `colors.palette.burnt-orange.*` |
| `palette.green.*` | `colors.palette.sap-green.*` |
| `palette.blue.*` | `colors.palette.cobalt-blue.*` |
| `palette.grey.*`, `palette.black` | Same family/leaf under `colors.palette` |
| `style.primary.S`, `style.secondary.S` | `colors.brand.primary.S`, `colors.brand.secondary.S` |
| `style.info.S`, `style.success.S`, `style.warning.S`, `style.danger.S` | Same status/state under `colors.feedback` |
| `role.T.color-background` | `components.general.background.default`, mode T |
| `role.T.color-text`, `color-text-secondary`, `color-text-disabled` | `components.general.foreground.default`, `.secondary`, `.disabled` |
| `role.T.color-border`, `color-control-border` | `components.general.border.default`, `.control` |
| `role.T.state-hover`, `state-pressed`, `color-disabled` | `components.general.background.hover`, `.pressed`, `.disabled` |
| `role.T.color-focus-ring`, `color-focus-halo` | `components.general.focus.ring.color`, `.halo.color` |
| `focus.ring-width`, `ring-offset`, `halo-width` | Corresponding general focus width/offset, referencing existing metrics |
| `role.T.color-primary`, `color-primary-hover`, `color-on-primary` | `components.general.action.primary.background.default`, `.background.hover`, `.foreground.default` |
| `role.T.color-secondary`, `color-secondary-hover`, `color-on-secondary` | Same paths under `components.general.action.secondary` |
| `role.T.color-<status>-surface`, `color-<status>-border`, `color-<status>-text` | `components.general.feedback.<status>.background.default`, `.border.default`, `.foreground.default` |
| `role.T.color-<status>`, `color-on-status`, `color-on-warning`, `color-warning-label-surface` | Explicit solid feedback contexts with background/foreground pairs; split shared foreground into aliases, preserve warning's distinct label background |
| `role.T.color-secondary-surface`, `color-on-secondary-surface` | Contextual secondary action background/foreground; do not merge with the solid secondary pair above |
| `role.T.color-destructive-surface`, `color-on-destructive-surface` | Contextual danger action background/foreground; preserve distinction from feedback danger |
| `role.T.color-emphasis-surface`, `color-on-emphasis`, `color-emphasis-border` | `components.general.emphasis.background.default`, `.foreground.default`, `.border.default` |
| `role.T.color-selected`, `color-on-selected`, `color-selected-text` | Selection background/foreground contexts; preserve distinct filled-control and text-on-overlay uses |
| `role.T.color-surface`, `color-surface-hover`, `color-neutral-surface` | Inventory consumers and assign functional background contexts; no global search-and-replace or silent value merge |
| `role.T.color-*-body-text`, `color-neutral`, `color-neutral-text`, `color-neutral-border` | Preserve actual text/icon/status context in general foreground or feedback groups after consumer inventory |
| `role.T.dialog-overlay` | `components.dialog.overlay.default` |
| `role.T.navigation-bar-current-indicator` | `components.navigation-bar.current-indicator.background.default` |
| `role.T.grid-cell-secondary-surface` | `components.data-grid.cell.secondary.background.default` |
| `role.T.code-block-surface` | `components.code-block.background.default` |
| Claude's page/card/dialog/popover/menu/sidebar background tokens | Corresponding `components.<component>.background.default`; retain secondary Card as its own variant |
| `radius.control`, `radius.surface`, `radius.pill` | `metrics.radius.control`, `.container`, `.pill` |
| `density.<level>.*` | `metrics.density.<level>.*`, preserving values and the independent density axis |
| `typography.font-size-hN` | `typography.font-size.hN` |
| `typography.heading-weight` | `typography.font-weight.heading` |
| `typography.line-height`, `line-height-tight` | `typography.line-height.body`, `.heading` only after verifying consumers; otherwise choose the actual purpose |

The inventory-dependent rows are deliberate blockers, not permission to invent
semantics. For each, list consumers, theme values and proposed replacements in
the manifest. Resolve names before running bulk substitutions. New tokens from
Claude's merges receive the same review, including any palette step/value
conflicts with the full reference image.

### Platform contract

Proposed CSS names use `--ds-` followed by all logical path segments joined
with hyphens. Examples: `--ds-components-general-background-default` and
`--ds-components-card-background-default`. Check flattening for collisions;
do not abbreviate different paths into the same public property.

Map these tokens to idiomatic typed Dart APIs with an explicit mapping table.
Do not expose JSON parsing or string-path lookups as the component API merely
to make all adapters identical. Follow ADR 0018 and preserve accessibility
requirements, SSR safety and existing application-controlled behaviour.

Update all four web adapters, Flutter, documentation site styles and examples,
generated API/prop/token registries where affected, build scripts and contract
tests. Search source, fixtures and docs for legacy paths and CSS names. Historical
ADRs, changelogs and the migration manifest may retain old names as history;
runtime exports and current usage examples may not.

Font families remain typed font-family data, sizes are dimensions, line-height
is unitless where currently unitless, and weights retain their proper type.
Keep rem semantics on the web; convert units only at platform boundaries with
the conversion basis documented. Do not turn every metric into a pixel literal.

Density must not lower existing touch or keyboard target guarantees. Existing
motion/elevation tokens, if found, need a separate inventory and naming decision;
this reform does not authorise new motion values, shadows or timing changes.

### Implementation sequence and acceptance gates

1. **Baseline:** record main SHA, clean/dirty state, approved palette source and
   PR integration status. Do not overwrite another agent's uncommitted work.
2. **Inventory:** enumerate every leaf, recipe, CSS variable, typed API and
   consumer. Produce the exhaustive mapping manifest. Resolve technical details.
3. **Specification:** document the approved reform in the ADR and schema. Validate naming, ownership and
   reference directions before modifying consumers.
4. **Model:** migrate values and references, retaining exact theme results.
   Compare resolved pre/post values and recipes for every mapped token.
5. **Consumers:** update all adapters, tenant/theme configuration and generators.
   Remove legacy runtime names; update examples and the migration guide.
6. **Exports:** regenerate all affected artifacts. Run generators twice and
   confirm the second run makes no changes. Do not hand-edit generated files.
7. **Verification:** run the relevant repository gate, adapter tests, builds,
   browser interaction checks and visual comparisons. Any unexplained colour,
   sizing, contrast, focus or layout change fails acceptance.

Required automated coverage:

- All 132 approved palette steps plus Grey 0 and additional approved colours
  exist with exact values, or palette completion is explicitly reported blocked
  on missing original data. Never report completeness from screenshots alone.
- Every old token is accounted for and every internal consumer uses its new
  contract. No dangling references, cycles, collisions or legacy aliases exist.
- Every required theme resolves every consumed token with the correct type.
  No unresolved theme silently falls back to a different theme.
- Changing a brand/feedback dependency propagates to all declared descendants.
  Unrelated branches and palette values remain unchanged.
- Changing general background affects inheriting components, while a specific
  Card override affects Card only. Test foreground and border overrides too.
- Mix recipes, alpha, unit conversion and density remain consistent across
  platforms. Disabled, hover, pressed, focus and selected states are tested
  where implemented; absent states are not manufactured to fill a matrix.
- Button Default and Ghost hover backgrounds remain equal in Light and Dark;
  Default's border and foreground stay unchanged.
- Direct export aliases remain aliases. Any computed export limitation is
  detected, documented and tested rather than presented as live inheritance.

Capture a before/after verification matrix per adapter, theme and affected
component/state. Existing snapshots are evidence, not files to refresh just
to obtain green tests. Record unavailable checks as not tested. Automated
contrast and keyboard checks do not constitute assistive-technology verification.

### Approval clarification, 2026-10-18

The reform is approved. The previous request to approve its architecture again
was an assistant error and is withdrawn. Technical implementation details are
not additional user approval gates.

Keep `components/general` for the shared defaults and resolve theme storage,
CSS naming, opacity/density placement and functional replacement names
consistently with the approved model. Document these choices and preserve all
existing approved values and distinct uses. Do not discard a value to simplify
the mapping.

Ask only if an actual conflict requires changing the requested behaviour,
appearance, scope or result. Missing original palette data must be reported,
not guessed.

Implementation remains paused until the user confirms Claude's merges are
complete. The approval to implement does not authorise commit, push, merge or
publication of this new reform.
