# ScrollArea parity checklist

Reference commit: `ade01acbb98d397c01af108a15c9da4bb9420720`

Reference paths: `core/src/scroll-area` `packages/svelte/src/lib/scroll-area`

The Flutter `ScrollArea` checked against the Svelte `ScrollArea`
(`packages/svelte/src/lib/scroll-area/ScrollArea.svelte`), the headless
scroll area of `core/src/scroll-area`.
Docs page: [Scroll Area](https://dr2madre.github.io/invisible-ui/components/navigation/scroll-area/).

The web component exists because browsers draw their own scroll bars and a
scrolling region needs a keyboard path. Both hold in Flutter, which draws no
scroll bar in the widgets layer on mobile, a platform one on desktop, and
gives a scroll view no focus, so the component is ported. The core's thumb
geometry is Flutter's `RawScrollbar`, so the core module is not carried.

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/scroll_area_test.dart` that holds it.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `child` (required) | `children` | the content |
| `orientation: ScrollAreaOrientation.vertical`, `horizontal`, `both` | `orientation: "vertical"`, `"horizontal"`, `"both"` | the axes that scroll |
| `maxHeight` (logical pixels, 192 by default) | `maxHeight` (a CSS length, `12rem`) | the tallest the viewport grows |
| `semanticLabel` | `label` | the region's name |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The viewport stops at `maxHeight` and scrolls | matched | `the viewport stops at maxHeight and scrolls with the keys while it has focus` |
| The focusable viewport scrolls with the keyboard | adapted | the browser's keys are written out: arrows by 40, Page Up, Page Down and Space by 80 % of the viewport, Home and End to the ends: same test |
| Horizontal arrows follow the direction | matched | `horizontal arrows follow the direction: right to left, the left arrow moves on` |
| Right to left, the horizontal thumb starts at the right and a drag moves the content the way the thumb goes | open | the horizontal scroll view follows `Directionality`, and `RawScrollbar` places its thumb from the scroll position, but no widget test drags the horizontal thumb right to left; the web holds it in each adapter with a right-to-left `scrollLeft` |
| A control inside keeps its keys | matched | `a control inside keeps its keys` |
| Both axes, each with its own bar | matched | `both axes scroll, each with its own bar` |
| The thumb drags; the wheel scrolls | matched | `the thumb drags; a wheel scrolls; the focus ring shows from the keyboard` |
| Thumb size and offset from the scroll metrics (`core/src/scroll-area`) | adapted | Flutter's `RawScrollbar` derives them |
| No platform bar on top of the theme's | matched | the scroll behaviour's own bars are turned off |
| A scroller that takes focus only while its content is wider than it (`observeInlineOverflow` in `core/src/scroll-area`) | matched | the reference uses it for the Table Set card, not for `ScrollArea`, which is always a tab stop in both adapters. The shared `Scroller` widget takes `focusableOnlyWhenScrollable` for the same rule, and `Table` sets it: `a table wider than its container scrolls sideways and its viewport takes focus; a table that fits adds no tab stop` in `test/table_test.dart` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| With `label`, a named region | matched | `SemanticsRole.region` (Flutter 3.35) on a node named by the label, focusable, with the scroll actions: `semantics: a named region the keyboard reaches; text scale 2.0 in a narrow parent`. Assistive technology: not tested |
| The bars are hidden from assistive technology | matched | `RawScrollbar` adds no semantics |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Overlay bars 0.5 rem thick, 2 pixels in, pill thumb in the border colour | matched | `both axes scroll, …`, `the thumb drags; …` |
| The thumb darkens on hover | adapted | `RawScrollbar` has no hover colour; the thumb keeps the border colour |
| The text colour | matched | `semantics: …` checks the text contrast |
| The focus ring around the viewport | matched | `the thumb drags; …` |
| Text scale 2.0, a narrow parent | matched | `semantics: …` |
| Targets | out of scope | the viewport is a region, not a control; the thumb is a pointer convenience, the keys are the path |
