# Link parity checklist

Reference commit: `27ae41b22e7951ac8b1cbd78fb0f1e70a3c5e7c6`

Reference paths: `packages/svelte/src/lib/link`

The Flutter `Link` checked against the Svelte `Link`
(`packages/svelte/src/lib/link/Link.svelte`), a presentational `<a>` with
no core.
Docs page: [Link](https://dr2madre.github.io/invisible-ui/components/navigation/link/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/link_test.dart`
that holds it.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `onPressed` (required) | `href` (required) | the destination; Flutter opens it through the app's callback, a route or a URL the app launches, so the package carries no URL plugin |
| `uri` | `href` | the announced address |
| `external`, `variant: LinkVariant.subtle` | `external`, `variant: "subtle"` | the same meanings |
| `semanticLabel` | `aria-label` | the accessible name |
| `target`, `rel` | `target`, `rel` | out of scope: the app decides where the destination opens |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A tap and Enter follow the link; Space does not | matched | `a tap and Enter open the link through the callback; Space does not` |
| `external` opens in a new tab with a safe `rel` | adapted | no browser tabs; `external` marks a destination outside the app with the arrow, and the app opens it: `external adds a trailing arrow, at the inline-end right to left` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A link (`<a href>`) with its address | matched | `semantics: a link with its address; the label replaces the text when given` |
| The arrow is decorative | matched | `Glyph` has no semantics |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Underlined in the selection colour; subtle keeps the text colour with a quiet underline | matched | `underlined in both variants; the subtle one keeps the text colour; hover deepens the colour` |
| Hover deepens the colour | matched | same test |
| Takes the surrounding text style | matched | same test |
| Focus ring around the link | matched | `FocusRingPainter` |
| A long link wraps at text scale 2.0 in a narrow column | matched | `a long link wraps at text scale 2.0 in a narrow column and keeps 44 by 44 under touch` |
| Targets 24 by 24, 44 by 44 under touch | adapted | the web's inline links are exempt from WCAG 2.5.8; Flutter's link keeps the minimum target, so a link set in a paragraph through a `WidgetSpan` raises its line to the target: `semantics: …` (24), same test (44) |
