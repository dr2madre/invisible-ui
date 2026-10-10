# Code parity checklist

Reference commit: `e32e67cd2cc2fb993c9758007c27026cafc20420`

Reference paths: `packages/svelte/src/lib/code`

The Flutter `Code` checked against the Svelte `Code`
(`packages/svelte/src/lib/code/Code.svelte`).
Docs page: [Code](https://dr2madre.github.io/invisible-ui/components/formatting-display/code/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/code_test.dart`
that holds it.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `Code('text')` | `<Code>text</Code>` | the code, always shown as text |

## Behaviour and semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Inline in a sentence | adapted | a widget set in a paragraph through a `WidgetSpan` |
| Read as its text | matched | `monospaced text at 0.875 of the surrounding size, on the neutral surface; it wraps in a narrow parent` |
| `<code>` marks code | adapted | Flutter has no code role; the text is read as it is |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Monospace at 0.875 em, padding 0.1 em by 0.35 em | matched | same test |
| The neutral surface and border, the text colour, the control radius | matched | same test, with the text contrast |
| Wraps (`white-space: break-spaces`) | matched | same test, at text scale 2.0 in a narrow parent |
| The monospace stack (`--ds-font-mono`) | adapted | the stack is not in `tokens.json`; `InvisibleThemeData.monoFontFamily` sets the family and the web stack is the fallback |
| Targets | out of scope | not interactive |
