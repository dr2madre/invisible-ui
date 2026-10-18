# Toolbar parity checklist

Reference commit: `5df411f6ee7583b84e5a6d5cbd113ff147043f7d`

Reference review (2026-10-18): checked the token-model change in the Svelte
reference. Behavior and accessibility markup did not change; CSS token names
changed, with resolved Light/Dark values checked by the token runtime tests.

Reference paths: `core/src/toolbar` `packages/svelte/src/lib/toolbar`

The Flutter `Toolbar` checked against the Svelte `Toolbar`
(`packages/svelte/src/lib/toolbar/Toolbar.svelte`) and the shared key rule
in `core/src/toolbar` (`nextIndex`, `controlKind`), which follow the
[WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).
Docs page: [Toolbar](https://dr2madre.github.io/invisible-ui/components/patterns/toolbar/).

Each line is **matched**, **adapted** (with the platform reason), **open**
(Flutter lacks it; the reason states the gap) or **out of scope**. Every
matched line names the widget test in `test/toolbar_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `semanticLabel` | `label` | the accessible name, required |
| `orientation: Axis.horizontal`, `Axis.vertical` | `orientation="horizontal"`, `"vertical"` | layout and arrow keys |
| `children` | the children | the controls |
| `flat` | `flat` | toggle buttons inside without their own border and fill at rest |
| `ToolbarSeparator` | `Separator` inside the toolbar | a line between groups |

## Keyboard and focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| One tab stop for the whole toolbar | matched | `Tab enters the toolbar once and leaves it next` |
| Left and right move in a horizontal toolbar, wrapping | matched | `left and right move and wrap; Home and End jump` |
| Home and End jump to the ends | matched | same test |
| Right to left mirrors the arrows | matched | `right to left mirrors the arrows` |
| Up and down move in a vertical toolbar; the side arrows do nothing | matched | `a vertical toolbar uses up and down` |
| Disabled controls are skipped | matched | `disabled controls are skipped` |
| The last focused control keeps the tab stop | matched | `focus returns to the control that had it last` |
| A tab stop on a control that becomes disabled or goes moves to the first enabled control | matched | `the tab stop moves to the first enabled control when its holder is disabled` |
| Key arithmetic shared with the other adapters | matched | `nextIndex` in `lib/src/internal/roving.dart` is the Dart form of `core/src/toolbar/state.ts` for moving focus; the shared menu keyboard layer uses the same intent and action. It has no `control` option: see the next line |
| A focused text input keeps the keys its caret needs: Left and Right in a horizontal toolbar, Up and Down in a vertical one, and Home and End; multi-line content keeps every arrow. A read-only input does not | matched | `a focused text field keeps Left, Right, Home and End for its caret`, `in a vertical toolbar a text field keeps Up and Down; a multi-line one keeps every arrow`, `a read-only field leaves the arrows to the toolbar`. `nextIndex` in `lib/src/internal/roving.dart` takes the `control` kind as core does; `controlKind` reads it from the focused `EditableText` (read-only is `other`, more than one line or a multi-line keyboard is `multiline`), and a declined key goes on to the field's own text editing shortcuts |
| Controls found by DOM query (buttons, toggles, links, fields, but not hidden inputs) | adapted | Flutter has no selector query: every focusable, traversable control inside is a stop, in reading order, through a `FocusTraversalGroup` policy that exposes only the tab stop. Flutter has no hidden input, so there is nothing to leave out |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="toolbar"` named by `aria-label` | adapted | Flutter has no toolbar role; the toolbar is a semantics container named by `semanticLabel`: `the toolbar is a group named by its label; separators are silent` |
| `aria-orientation` | adapted | no Flutter property; the arrow keys follow `orientation` |
| Separator `role="separator"` | adapted | Flutter has no separator role; the line has no semantics and takes no focus: same test |
| Labeled controls | matched | same test, `labeledTapTargetGuideline` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Layout, tokens and states

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A crowded toolbar wraps to more rows instead of widening the page | matched | `a crowded toolbar wraps at text scale 2.0 in a narrow space` |
| Vertical toolbar stacks and stretches its controls | matched | `a vertical toolbar uses up and down` renders it |
| Gap 0.375rem, padding 0.25rem, 1 px border in `color.border`, radius `radius.control`, background | matched | the reference sets them in its stylesheet; same numbers and roles |
| Targets follow the theme: 44 by 44 under touch | matched | `targets are at least 44 by 44 under touch` |
| `flat` presentation (borderless toggle buttons) | matched | `a flat toolbar draws its toggle buttons without border and fill at rest, with the hover tint; a toggle that is on keeps its look`. `Toolbar(flat: true)` marks its subtree, and each `ToggleButton` drops its fill and paints its border transparent at rest (the width stays, so nothing moves), with `state-hover` under the pointer; the toolbar keeps its frame, as on the web |
| Overflow menu | out of scope | the reference has none; it wraps |
