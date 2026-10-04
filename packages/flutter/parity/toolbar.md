# Toolbar parity checklist

Reference commit: `bde4433a71312b89d1164c6a1adce57471999a4a`

Reference paths: `core/src/toolbar` `packages/svelte/src/lib/toolbar`

The Flutter `Toolbar` checked against the Svelte `Toolbar`
(`packages/svelte/src/lib/toolbar/Toolbar.svelte`) and the shared key rule
in `core/src/toolbar` (`nextIndex`), which follow the
[WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).
Docs page: [Toolbar](https://dr2madre.github.io/invisible-ui/components/patterns/toolbar/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/toolbar_test.dart`
that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `semanticLabel` | `label` | the accessible name, required |
| `orientation: Axis.horizontal`, `Axis.vertical` | `orientation="horizontal"`, `"vertical"` | layout and arrow keys |
| `children` | the children | the controls |
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
| Key arithmetic shared with the other adapters | matched | `nextIndex` in `lib/src/internal/roving.dart` is the Dart form of `core/src/toolbar/state.ts`; the shared menu keyboard layer uses the same intent and action |
| Controls found by DOM query (buttons, toggles, links, fields) | adapted | Flutter has no selector query: every focusable, traversable control inside is a stop, in reading order, through a `FocusTraversalGroup` policy that exposes only the tab stop |

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
| `flat` presentation (borderless toggle buttons) | out of scope | it styles toggle buttons, which the Flutter package does not have yet |
| Overflow menu | out of scope | the reference has none; it wraps |
