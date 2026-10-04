# Collapsible parity checklist

Reference commit: `27ae41b22e7951ac8b1cbd78fb0f1e70a3c5e7c6`

Reference paths: `core/src/collapsible` `packages/svelte/src/lib/collapsible`

The Flutter `Collapsible` checked against the Svelte `Collapsible`
(`packages/svelte/src/lib/collapsible/Collapsible.svelte`), the WAI-ARIA
disclosure pattern of `core/src/collapsible`.
Docs page: [Collapsible](https://dr2madre.github.io/invisible-ui/components/data-layout/collapsible/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/collapsible_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Collapsible(expanded:, onExpansionChanged:)` | `open` with `onOpenChange` | controlled `open`, change callback; the names of Flutter's own `ExpansionTile` |
| `Collapsible.uncontrolled(initiallyExpanded:)` | `open` unbound | `defaultOpen` |
| `label` | `label` | the header text, `collapsible.toggle` by default |
| `trigger` (a widget) | `trigger` snippet | the header content |
| `child` | `children` snippet | the content |
| `enabled: false` | `disabled` | `disabled` |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A tap toggles, reported once per toggle | matched | `a tap toggles, reports each toggle once, and hides the content when collapsed` |
| Enter and Space toggle the focused header | matched | `Enter toggles the focused header`, `Space toggles the focused header` |
| Collapsed content is hidden (`hidden`) | matched | `a tap toggles, reports each toggle once, and hides the content when collapsed` |
| Hidden content keeps its state and leaves the focus order | matched | `hidden content keeps its state and leaves the focus order` |
| Reflection never reports | matched | `a changed value is shown without a report` |
| Disabled: no focus, no toggle | matched | `disabled: no focus, no toggle, reported disabled` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The header is a button with `aria-expanded` | matched | `semantics: a button that reports expanded and collapsed; the label defaults to the catalog` |
| `aria-controls` links the header to the content | adapted | Flutter semantics have no relation between nodes; the content follows the header in reading order |
| Default label from the catalog (`collapsible.toggle`) | matched | same test |
| Disabled reported | matched | `disabled: no focus, no toggle, reported disabled` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Bordered header, chevron at the inline-end turning half a turn | matched | `right to left, text scale 2.0, narrow: the chevron sits at the inline-end and the label wraps` |
| The chevron turns at once under reduced motion | matched | `the chevron turns at once under reduced motion` |
| Focus ring outside the header | matched | `DisclosureTrigger`, the shared focus ring painter |
| A long label wraps; text scale 2.0 and a narrow width keep the task | matched | `right to left, text scale 2.0, narrow: the chevron sits at the inline-end and the label wraps` |
| Width `18rem` | adapted | the width the parent gives, 288 when it is open, as `Field` does |
| Targets 24 by 24, 44 by 44 under touch | matched | `semantics: …` (24), `the header keeps 44 by 44 under touch` |
