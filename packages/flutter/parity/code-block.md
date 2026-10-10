# CodeBlock parity checklist

Reference commit: `e32e67cd2cc2fb993c9758007c27026cafc20420`

Reference paths: `packages/svelte/src/lib/code-block`

The Flutter `CodeBlock` checked against the Svelte `CodeBlock`
(`packages/svelte/src/lib/code-block/CodeBlock.svelte`), with the catalog
names of the React adapter.
Docs page: [Code Block](https://dr2madre.github.io/invisible-ui/components/formatting-display/code-block/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/code_test.dart`
that holds it.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `code` (required) | `code` | the source: what shows and what the copy button copies |
| `language` | `language` | the caption |
| `copyable`, `copyLabel` | `copyable`, `copyLabel` | the copy button and its name |
| `child` | `children` | highlighted text shown in place of `code` |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `code` keeps its white space and is always text | matched | `the code shows as written text, white space kept, in a group named with the caption` |
| Copy writes `code` to the clipboard | matched | `copy writes the code, shows Copied for two seconds and announces it politely; Enter copies too` (Flutter's `Clipboard`) |
| "Copy" turns to "Copied" for 2 seconds | matched | same test |
| A refused clipboard shows and announces nothing | matched | `a refused copy shows and announces nothing` |
| A copy that ends after the block is gone starts no timer | matched | `a copy that ends after the block is gone starts no timer` |
| `children` replaces the text; `code` still drives the copy | matched | `highlighted text replaces the code and the copy still uses the code; text scale 2.0 right to left` |
| No copy button when `copyable` is false | matched | `the code shows …` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The block is a group named "Code" or "Code: {language}" (`codeBlock.label`, `codeBlock.labelLanguage`) | adapted | Flutter 3.32 has no group role; a container node with that name: `the code shows …` |
| The scroller takes focus and is named "Code sample" or "Code sample, {language}" | matched | same test, and `the scroller takes focus with the ring inside and scrolls a wide sample with the arrows` |
| The copy button is named `copyLabel ?? "Copy code"` | matched | `the code shows …` |
| "Copied to clipboard" through a polite live region | adapted | Flutter announces it with `SemanticsService`, politely: `copy writes the code, …` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The surface, border and surface radius; a header with the caption in lower case and the copy button | matched | `the code shows …` checks the text contrast |
| Monospace at 0.875 rem, line height 1.6, 1 rem padding | matched | `the code shows …` |
| Wide code scrolls sideways; the focus ring inside the scroller | matched | `the scroller takes focus …` (the scroller is `ScrollArea`'s) |
| The copy button's fill: black at 5 %, 10 % on hover | adapted | the text colour at 5 % and 10 %, so it reads in dark mode too |
| Text scale 2.0, right to left | matched | `highlighted text replaces …` |
| Copy button target 24 by 24 | matched | `the code shows …` |
