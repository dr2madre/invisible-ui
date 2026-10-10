# Separator parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `packages/svelte/src/lib/separator`

The Flutter `Separator` checked against the Svelte `Separator`
(`packages/svelte/src/lib/separator/Separator.svelte`): a thin line between
content, `role="separator"` unless `decorative`.
Docs page: [Separator](https://dr2madre.github.io/invisible-ui/components/formatting-display/separator/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/separator_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `orientation` | `orientation` | horizontal or vertical |
| none | `decorative` | adapted: see Semantics |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="separator"` with `aria-orientation` | adapted | Flutter semantics have no separator role, and a label would announce an invented word; the separator adds no node, as the web's `decorative` one, and the content on either side carries the structure: `horizontal: a 1 pixel line as wide as its parent, in the border colour, with no semantics` |
| `decorative` hides it | adapted | the only Flutter behaviour, so the parameter is not carried |

## Look

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Horizontal: 1px, full width, in the border colour | matched | `horizontal: a 1 pixel line as wide as its parent, in the border colour, with no semantics` |
| Vertical: 1px, stretched across its row, at least 1em tall | matched | `vertical: at least a line of text tall, growing with the text scale, stretched by a stretching row` |
| `--ds-separator-gap` margin | out of scope | spacing around the line belongs to the parent layout in Flutter |
