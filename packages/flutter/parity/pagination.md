# Pagination parity checklist

Reference commit: `27ae41b22e7951ac8b1cbd78fb0f1e70a3c5e7c6`

Reference paths: `core/src/pagination` `core/src/internal/collection.ts` `packages/svelte/src/lib/pagination`

The Flutter `Pagination` checked against the Svelte `Pagination`
(`packages/svelte/src/lib/pagination/Pagination.svelte`) and
`core/src/pagination`.
Docs page: [Pagination](https://dr2madre.github.io/invisible-ui/components/navigation/pagination/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/pagination_test.dart` that holds it. The page list also answers the
shared vectors in `core/src/pagination/__vectors__`
(`test/navigation_vectors_test.dart`).

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Pagination(page:, onPageChanged:)` | `page` with `onPageChange` | controlled `page`, change callback; `onPageChanged` as Flutter's `PageView` says |
| `Pagination.uncontrolled(initialPage:)` | `page` unbound | `defaultPage` |
| `pageCount`, `siblingCount`, `boundaryCount` | the same names | the page list |
| `enabled: false` | `disabled` | `disabled` |
| `label` | `label` | the navigation's name, `pagination.label` by default |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Boundary pages, siblings and gaps (`pageItems`) | matched | `shows the boundary pages, the siblings and the gaps; a tap goes to a page and reports once`, and the shared vectors |
| A tap goes to a page, reported once | matched | same test |
| Previous and next disabled at the ends | matched | `previous and next are disabled at the ends` |
| Arrows move focus only, wrapping and skipping disabled controls; Home and End | matched | `arrows move focus without moving the page, wrapping and skipping disabled controls; Enter and Space go; mirrored right to left` |
| Right to left: left and right swap | matched | same test |
| Enter and Space go to the focused control's page | matched | same test |
| One tab stop, on the current page | matched | `one tab stop, on the current page` |
| A key press that disables previous or next moves focus to the current page | matched | `a key press that disables previous moves focus to the current page`; the React adapter's rule, where the Svelte control loses focus |
| A changed page is shown, clamped, without a report | matched | `a changed page is shown, clamped, without a report` |
| Disabled: nothing focusable or pressable | matched | `disabled: nothing focusable or pressable` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `<nav>` named from the catalog | adapted | Flutter has no landmark role; a container named `pagination.label`: `semantics: a navigation named from the catalog; the current page is read as such` |
| Page buttons named `pagination.page`; previous and next named from the catalog | matched | same test |
| `aria-current="page"` | adapted | Flutter semantics have no current-item property; the current page's value is `pagination.current` ("current page"), a catalog key added for this: same test |
| The gaps are hidden from assistive technology | matched | `_Gap` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Square bordered buttons; the current page filled and bold | matched | `_PageButton` |
| Previous and next dim when disabled; pages do not | matched | `_PageButton(step:)` |
| Chevrons mirror right to left | matched | `GlyphShape.chevronStart` and `chevronEnd`; the web's `‹` and `›` mirror as text |
| A long list wraps in a narrow column at text scale 2.0 | matched | `a long list wraps in a narrow column at text scale 2.0; buttons keep 44 by 44 under touch` |
| Targets 24 by 24, 44 by 44 under touch | matched | `semantics: …` (24), same test (44) |
