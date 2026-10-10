# ToggleGroup parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `packages/svelte/src/lib/toggle-group`

The Flutter `ToggleGroup` checked against the Svelte `ToggleGroup`
(`packages/svelte/src/lib/toggle-group/ToggleGroup.svelte`): a visual group
of independent toggle buttons with an optional name. It holds no state and
has no keyboard of its own; each toggle stays its own tab stop.
Docs page: [Toggle Group](https://dr2madre.github.io/invisible-ui/components/forms/toggle-group/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/toggle_group_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `ToggleGroup(children:)` | children | the toggles |
| `variant: ToggleGroupVariant.separate` / `.segmented` | `variant` | the look |
| `orientation`, `wrap` | the same names | as on the web |
| `semanticLabel` | `label` | the optional group name |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| No state: each toggle keeps its own value and is its own tab stop | matched | `separate: each toggle keeps its border; each is its own tab stop and keeps its own value` |
| No arrow keys of its own; inside a toolbar, the toolbar's arrows move between the toggles | matched | `inside a toolbar, the arrows move between the toggles` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="group"` named by `label` when given | adapted | Flutter has no group role; a container named by `semanticLabel`, as the Toolbar: `separate: each toggle keeps its border; each is its own tab stop and keeps its own value` |

## Look

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Separate: each toggle's own look, 0.375rem apart | matched | `separate: each toggle keeps its border; each is its own tab stop and keeps its own value` |
| Segmented: one border around the toggles, a line between each two, the toggles without border and corners | matched | `segmented: the toggles drop their border and corners, the group draws one border and a line between each two` |
| Segmented: the focus ring inside the toggle, since the group clips | matched | `FocusRingPainter(inside: true)` in a joined group |
| Vertical stacks; right to left mirrors | matched | `vertical stacks; right to left mirrors the row` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `wrap`: a horizontal separate group wraps instead of overflowing; segmented ignores it | matched | `wrap: a narrow row of chips wraps at text scale 2.0 without overflow, and keeps 44 targets under touch` |
