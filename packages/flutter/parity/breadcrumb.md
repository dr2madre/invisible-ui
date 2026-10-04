# Breadcrumb parity checklist

Reference commit: `27ae41b22e7951ac8b1cbd78fb0f1e70a3c5e7c6`

Reference paths: `packages/svelte/src/lib/breadcrumb`

The Flutter `Breadcrumb` checked against the Svelte `Breadcrumb`
(`packages/svelte/src/lib/breadcrumb/Breadcrumb.svelte`), a presentational
component with no core.
Docs page: [Breadcrumb](https://dr2madre.github.io/invisible-ui/components/patterns/breadcrumb/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/breadcrumb_test.dart` that holds it.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `items: [BreadcrumbItem(label:, onPressed:, uri:, home:)]` | `items: [{ label, href, home }]` | the trail; a step opens through `onPressed`, the app's navigation, and `uri` is its announced address |
| `label`, `separator` | the same names | the trail's name and the text between steps |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Ancestors are links that open their page | adapted | a link opens through the app's callback rather than an `href`, since Flutter has no browser navigation: `ancestors open through their callbacks, by tap or Enter; the current page is not a link` |
| The current page, last, is not a link | matched | same test |
| A step without a destination shows as text | matched | `step()`, the branch every non-linked step takes |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `<nav><ol>` named from the catalog | adapted | Flutter has no landmark role; a list (`SemanticsRole.list`, items `SemanticsRole.listItem`) named `breadcrumb.label`: `semantics: a list named from the catalog; links named by their label, the home glyph too; the current page read as such` |
| `aria-current="page"` on the last step | adapted | Flutter semantics have no current-item property; the step's value is `breadcrumb.current` ("current page"), a catalog key added for this: same test |
| A home glyph link named by its label | matched | same test |
| Separators decorative | matched | `the separators are decorative and the label is the app's when given` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Underlined links in the selection colour; the current page bold and grey | matched | `Link`, and `step()` |
| A long trail wraps; right to left it runs from the right | matched | `right to left the trail runs from the right; a long trail wraps at text scale 2.0 and keeps 44 by 44 links under touch` |
| Targets 24 by 24, 44 by 44 under touch | adapted | the web's inline links are exempt from WCAG 2.5.8; Flutter's links keep the minimum target: `semantics: …` (24), same test (44) |
