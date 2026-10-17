# ToggleGroup parity checklist

Reference commit: `31edd44ea7637357a2eac288bcc050e07f52852f`

Reference paths: `packages/svelte/src/lib/toggle-group`

The Flutter `ToggleGroup` checked against the Svelte `ToggleGroup`
(`packages/svelte/src/lib/toggle-group/ToggleGroup.svelte`), the shared
keyboard rule in `core/src/toggle-group`, and the approved decision for
every adapter: a named group of independent toggle buttons;
with three or more toggles the group is one tab stop with arrow keys and
Home and End, mirrored in right-to-left text; with one or two each toggle is
its own tab stop; inside a toolbar the toolbar's keys apply; a change in the
number of toggles never loses focus. It holds no state. One choice among
several options is `SegmentedControl`.
Docs page: [Toggle Group](https://dr2madre.github.io/invisible-ui/components/forms/toggle-group/).

Each line is **matched**, **adapted** (with the platform reason), **open**
(a gap, with the reason), **out of scope** or **not yet verified**. Every matched line names the widget test in
`test/toggle_group_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `ToggleGroup(children:)` | children | the toggles |
| `variant: ToggleGroupVariant.separate` / `.segmented` | `variant` | the look |
| `orientation`, `wrap` | the same names | as on the web; `orientation` also picks the arrow keys |
| `semanticLabel` | `label` | the optional group name |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| No state: each toggle keeps its own value; any number can be on | matched | `separate: each toggle keeps its border; the group is a named container, not a toolbar; each toggle keeps its own value` |
| One toggle is one tab stop | matched | `one toggle is its own tab stop` |
| Two toggles are two tab stops, with no arrow keys | matched | `two toggles are two tab stops, and the arrows do not move between them` |
| Three or more toggles are one tab stop; Tab returns to the toggle that had focus last | matched | `three or more toggles are one tab stop that returns to the toggle that had focus last` |
| Arrows follow the reading direction and wrap; Home and End jump to the ends; right to left mirrors | matched | `horizontal, ltr: the arrows follow the reading direction and wrap; Home and End jump to the ends; moving focus flips nothing` and the `rtl` case |
| A vertical group takes up and down | matched | `vertical: up and down move, left and right do not` |
| A disabled toggle is skipped | matched | `a disabled toggle is skipped by the arrows` |
<<<<<<< HEAD
| The tab stop sits on the focused toggle, else the one focused last while it is enabled, else the first enabled one | matched | `three or more toggles are one tab stop that returns to the toggle that had focus last`, `the tab stop skips a disabled first toggle, and leaves a last focused toggle that turns disabled for the first enabled one` |
=======
| The tab stop sits on the focused toggle, else the one focused last while it is enabled, else the first enabled one | open | the Flutter traversal policy does this, but no widget test holds a disabled first toggle or a last focused toggle that turns disabled |
>>>>>>> origin/main
| Moving focus never flips a toggle; Enter and Space do | matched | the arrow key tests and `separate: each toggle keeps its border; the group is a named container, not a toolbar; each toggle keeps its own value` |
| Inside a toolbar, the toolbar's keys and its one tab stop apply, whatever the number of toggles | matched | `inside a toolbar, the toolbar's keys and its one tab stop apply, also with one or two toggles` |
| From three toggles to two and back, the focused toggle keeps focus | matched | `from three to two and back, the focused toggle keeps it` |
| A removed focused toggle passes focus to the next one, or the previous one at the end | matched | `when the focused toggle is removed, the next one takes focus, or the previous one at the end` |
| Focus the app moved elsewhere stays there | matched | `focus moved elsewhere by the app is left alone` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="group"` named by `label` when given, never a toolbar | adapted | Flutter 3.35 has no group role; a semantics container named by `semanticLabel` holds the toggles: `separate: each toggle keeps its border; the group is a named container, not a toolbar; each toggle keeps its own value` |
| Each toggle a button with a toggled state | matched | same test |
| Screen reader output on VoiceOver, TalkBack, NVDA | not yet verified | Assistive technology: not tested |

## Look

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Separate: each toggle's own look, 0.375rem apart | matched | `separate: each toggle keeps its border; the group is a named container, not a toolbar; each toggle keeps its own value` |
| Segmented: one border around the toggles, a line between each two, the toggles without border and corners | matched | `segmented: the toggles drop their border and corners, the group draws one border and a line between each two` |
| Segmented: the focus ring inside the toggle, since the group clips | matched | `FocusRingPainter(inside: true)` in a joined group |
| Vertical stacks; right to left mirrors | matched | `vertical stacks; right to left mirrors the row` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `wrap`: a horizontal separate group wraps instead of overflowing at a narrow width and text scale 2.0; segmented ignores it | matched | `wrap: a narrow row of chips wraps at text scale 2.0 without overflow; the targets meet 24 by 24, and 44 by 44 under touch` |
| Targets at least 24 by 24, and 44 by 44 under touch | matched | same test |
