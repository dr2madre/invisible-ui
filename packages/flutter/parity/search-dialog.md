# Search Dialog parity checklist

Reference commit: `31edd44ea7637357a2eac288bcc050e07f52852f`

Reference paths: `core/src/dialog` `core/src/combobox` `packages/svelte/src/lib/search-dialog`

The Flutter `SearchDialog` checked against the Svelte `SearchDialog` and
`createSearchDialog` (`packages/svelte/src/lib/search-dialog`) over the core
dialog and combobox. It builds the dialog family's panel, so the route,
focus trap, Escape, focus return and status area lines of
[dialog.md](dialog.md) hold for it.
Docs page: [Search Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/search-dialog/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/search_dialog_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `showInvisibleDialog<T>(builder: (_) => SearchDialog<T>(...))`, completing with the value or `null` | the trigger, `open` and `onSelect` | opening, and the choice |
| `SearchDialogItem<T>(value:, label:, group:, shortcut:, disabled:)` | `{ value, label, group, shortcut, disabled }` | a result; `shortcut` is a list of keys, one key for a single key |
| `items`, `suggestions`, `loading` | the same | the results, the empty-query results, the busy state |
| `onSelected(T)` | `onSelect(value)` | reports the choice after the dialog has closed |
| `onQueryChanged(String)` | none | the query, for results fetched as the user types |
| `filter` | `filter` (adapter context) | which results the query lets through |
| `title`, `hideTitle`, `closeButton` | the same | name, hidden by default, header close button |
| `label`, `placeholder`, `emptyText` | the same | the catalog's `searchDialog.*` keys by default |
| `controller` | `notify()` on the instance | the status area |

## Lines

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Focus goes to the field on open; the hidden title names the dialog | matched | `focus goes to the field; the hidden title names the dialog; ungrouped results first, then groups in order` |
| Ungrouped results first, groups in order of first appearance | matched | same test |
| A group's results sit in a container named by the group; the visible heading is hidden from assistive technology | adapted | Flutter has no group role: each run is a list named by its group (the ungrouped run by the field's name), and the heading text is excluded: same test |
| Nothing is highlighted on open | matched | same test |
| Typing filters and highlights the first enabled result | matched | `typing filters, highlights the first enabled result and announces each change of the count` |
| The result count is announced politely; "No results found." when nothing matches | adapted | the web updates a hidden `role="status"` region; Flutter announces the message through the accessibility channel when it changes, which is when a live region's text changes: same test |
| "Searching…" while loading; an indicator shows; the empty text waits | matched | `loading shows an indicator, announces it and holds the empty text` |
| Arrows cross groups in display order, skip disabled results and wrap | matched | `Down and Up cross groups in display order, skip disabled results, wrap, and announce the highlight` |
| The highlighted result is announced | adapted | Flutter has no `aria-activedescendant`: arrows announce the highlighted result politely; typing announces the count rather than the first match, so each keystroke is read once |
| Enter chooses the highlighted result | matched | `Enter chooses: the dialog closes first, then reports, and focus returns to the trigger` |
| `onSelect` runs, then the dialog closes | adapted | ADR 0011: Flutter closes first, then calls `onSelected`: same test |
| Enter during an input method composition | adapted | it chooses nothing: `Enter that ends an input method composition chooses nothing` |
| A press on a result chooses it; a disabled one does nothing | matched | `a press on a result chooses it; a disabled one does nothing` |
| Suggestions while the query is empty, with their own group | matched | `suggestions show while the query is empty` |
| Focus leaving the field keeps the query and the dialog | matched | `focus leaving the field keeps the query and the dialog` |
| Escape and the barrier close; focus returns | matched | `Escape closes with nothing chosen`; the Enter test |
| New items keep the highlight while it is listed | matched | `new items keep the highlight while it is still listed` |
| A shortcut renders as keycaps and is part of the result's name; the dialog binds no key | matched | `a shortcut shows as keycaps and is part of the name` |
| The query starts empty on every opening | matched | `the query starts empty on every opening` |
| The status area after the results (ADR 0016); a notice takes no focus | matched | `the search row shows the focus ring; a notice sits after the results and takes no focus` |
| Panel 32rem wide at most, 12% from the top, 60% of the screen high at most; the list scrolls under a fixed search row | adapted | 512 and the same shares of the screen; a short window or a large text scale scrolls the whole panel, as the family does: `right to left at text scale 2.0 on a narrow screen: no overflow; 44 by 44 targets under touch` |
| The search row shows the focus ring inside the panel's edge; the highlighted result shows a ring | matched | same test; the ring of the highlighted result is what `Down and Up cross groups …` reads |
| Results meet 44 by 44 under touch; contrast light and dark | matched | the layout test; `text contrast, light and dark` |
| Async results through `items` | adapted | a route's content does not rebuild with the page: the app rebuilds the dialog, for example with a `ValueListenableBuilder` in the builder, and hears the query through `onQueryChanged` |
| A trigger button inside the component | adapted | Flutter opens dialogs as routes: the app's own button or shortcut calls `showInvisibleDialog` |
| `--ds-search-dialog-*` variables | out of scope | the Flutter theme carries the shared roles |
| Screen reader output on VoiceOver, TalkBack, NVDA | not yet verified | Assistive technology: not tested |

## Background token

The background reads the component token `--ds-components-dialog-background-default` on the web and `InvisibleColors.dialogBackground` in Flutter, both generated from `packages/tokens/tokens.json`; `tokens-parity.test.ts` and the Dart token tests hold the values.
