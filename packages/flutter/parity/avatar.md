# Avatar parity checklist

Reference commit: `e32e67cd2cc2fb993c9758007c27026cafc20420`

Reference paths: `core/src/avatar` `packages/svelte/src/lib/avatar`

The Flutter `Avatar` checked against the Svelte `Avatar`
(`packages/svelte/src/lib/avatar/Avatar.svelte`), with the initials of
`core/src/avatar`.
Docs page: [Avatar](https://dr2madre.github.io/invisible-ui/components/data-layout/avatar/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/avatar_test.dart`
that holds it. The initials also answer the shared vectors in
`core/src/avatar/__vectors__/initials.json`, which the core tests run too.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `name` (required) | `name` (required) | the accessible name and the source of the initials |
| `image` (an `ImageProvider`) | `src` (a URL) | the photo; Flutter loads any provider, a network, asset or memory image |
| `semanticLabel` | `alt` | the accessible name in place of `name` |
| `size: AvatarSize.small`, `medium`, `large` | `size: "sm"`, `"md"`, `"lg"` | 32, 40 and 56 at text scale 1 |
| `shape: AvatarShape.circle`, `square` | `shape: "circle"`, `"square"` | the outline |
| `color` | `--ds-avatar-bg` | the background behind the initials |
| `initialsOf` | `initialsOf` | the initials function, exported by both |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Initials: first and last word, or two characters of one word, upper case; "?" when blank | matched | `initials answer the shared vectors` |
| A character is a grapheme cluster (emoji, combining marks) | matched | same test (Dart's `characters`, the web's `Intl.Segmenter`) |
| Case mapping that changes the length (ß to SS) | adapted | Dart upper-cases one character to one; the web gives "SS". Not in the shared vectors |
| The image shows when it loads; a failed image falls back to the initials | matched | `the image shows once loaded; a broken image keeps the initials` |
| The initials hold the place while the image loads | adapted | the web shows an empty box until the image paints; Flutter shows the initials, which reads the same: same test |
| A new `src` after a failure is tried again | matched | Flutter's `Image` loads a new provider by itself |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| One image (`role="img"`) named by `alt ?? name`; the initials hidden | matched | `semantics: one image named by the name or the label, with the initials hidden` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Sizes 2, 2.5 and 3.5 rem; initials at 0.75, 0.875 and 1.125 rem, weight 600 | matched | `sizes, shapes and the background colour; the box grows with the text` |
| Circle, or the control radius when square | matched | same test |
| Surface background, text colour | matched | `semantics: …` checks the text contrast |
| Grows with the text size (rem) | matched | `sizes, …` at text scale 2.0 |
| Targets | out of scope | not interactive |
