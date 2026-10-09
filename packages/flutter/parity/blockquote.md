# Blockquote parity checklist

Reference commit: `e32e67cd2cc2fb993c9758007c27026cafc20420`

Reference paths: `packages/svelte/src/lib/blockquote`

The Flutter `Blockquote` checked against the Svelte `Blockquote`
(`packages/svelte/src/lib/blockquote/Blockquote.svelte`).
Docs page: [Blockquote](https://dr2madre.github.io/invisible-ui/components/formatting-display/blockquote/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/blockquote_test.dart` that holds it.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `child` (required) | `children` | the quote |
| `cite` (a widget) | `cite` (text or a snippet) | the visible attribution |
| none | `citeUrl` | out of scope: the native `cite` attribute is not shown and Flutter semantics have no place for it |

## Behaviour and semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The attribution belongs to the quote and is read apart from it | matched | `the quote in italics, the attribution after a decorative em dash, read apart from the quote` |
| No attribution line without `cite` | matched | `without a cite there is no attribution line` |
| `<blockquote>` marks a quotation | adapted | Flutter has no quotation role; the quote is read as its text |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Italic text in the secondary text colour | matched | `the quote in italics, …` |
| A 3 pixel accent bar in neutral 400 at the inline-start, 1 rem padding | matched | `the accent bar sits at the inline-start, right to left at text scale 2.0 in a narrow parent` |
| The attribution at 0.875 rem after an em dash | matched | `the quote in italics, …` |
| Text scale 2.0, a narrow parent, right to left | matched | `the accent bar sits …` |
| Targets | out of scope | not interactive |
