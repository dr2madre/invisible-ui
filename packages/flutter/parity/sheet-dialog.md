# Sheet Dialog parity checklist

Reference commit: `31edd44ea7637357a2eac288bcc050e07f52852f`

Reference paths: `core/src/dialog` `packages/svelte/src/lib/sheet-dialog`

The Flutter `SheetDialog` checked against the Svelte `SheetDialog` and
`createSheetDialog` (`packages/svelte/src/lib/sheet-dialog`) and
[ADR 0013](https://github.com/dr2madre/invisible-ui/blob/main/docs/adr/0013-sidebar-and-the-menu-name.md).
It builds the dialog family's panel, so the route, focus trap, Escape, focus
return and status area lines of [dialog.md](dialog.md) hold for it.
Docs page: [Sheet Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/sheet-dialog/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/sheet_dialog_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `showInvisibleDialog(builder: (_) => SheetDialog(...))` | the trigger, `open`, `onOpenChange` | opening and closing |
| `side: SheetDialogSide.top / bottom / start / end` | `side: "top" / "bottom" / "left" / "right"` | the edge; start and end follow the reading direction |
| `draggable` | `draggable` | the grab handle |
| `size` | `--ds-sheet-dialog-size` | the extent away from the edge |
| `title`, `description`, `child`, `actions` | `title`, `description`, `children`, `footer` | name, description, body, footer |
| `closeButton`, `closeLabel` | `closeButton`, `closeLabel` | on by default; the catalog's `sheetDialog.close` |
| `icon`, `headerLead`, `headerActions`, `initialFocus`, `controller` | the snippets, `initialFocus`, `notify()` | header, focus on open, status area |
| `showInvisibleDialog(returnFocus:)` | `renderTrigger={false}`, `returnFocusTo` | where focus goes back when the page owns the button (ADR 0013) |

## Lines

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A modal dialog named by the title and described by the description; focus moves into the panel | matched | `modal, named and described, focus on the panel; the close button is named from the catalog` |
| The close button is on by default and named from the catalog | matched | same test |
| Escape, the close button and an action close it; focus returns | matched | `Escape and the close button close it; focus returns` |
| The body takes the space left; the footer sits at the far end, set apart by a border | matched | `the footer sits at the bottom, set apart by a border; a notice goes between the body and the footer` |
| The status area between the body and the footer (ADR 0016) | matched | same test |
| `right`/`left` anchor to the inline-end/start edge | adapted | the web names the sides physically and places them logically, so in right to left `side="right"` sits on the left. Flutter names them `end` and `start`, and the placement, the motion and the drag all follow the edge the panel is on: `end is the right edge left to right and the left edge right to left; start is the opposite` |
| Top and bottom: full width, 16rem high; sides: full height, 20rem wide; never larger than the screen | matched | same test; `the size grows with the text and stops at the screen` (rem grows with the text size) |
| No border along the anchored edge, no corner radius | matched | `no border along the anchored edge and square corners` |
| It slides in from its edge | matched | `it slides in from its edge, mirrored right to left`. The web slides a right-to-left `side="right"` panel in from the right while it sits on the left; Flutter slides from the edge the panel is on |
| No motion under reduced motion | matched | `under reduced motion it shows in place at once` |
| A snap home after a short drag animates | adapted | the web keeps the snap transition under reduced motion; Flutter snaps at once: `under reduced motion a short drag snaps home at once` |
| The handle only with `draggable`, not on the top side; hidden from assistive technology | matched | `the handle shows only when draggable and not at the top, and stays out of the semantics tree` |
| Release past a quarter of the extent dismisses; less snaps home | matched | `dragging past a quarter toward the edge closes; less snaps home` |
| A fast flick toward the edge dismisses | matched | `a flick toward the edge closes` (0.5 px/ms on the web, 500 px/s here) |
| Right to left, the drag follows the panel's edge | adapted | the web measures a `side="right"` drag toward the physical right while the panel sits on the left, so dragging it closed does not work; Flutter measures toward the panel's own edge: `right to left the end panel is dragged toward the left edge; a drag inward does nothing` |
| The handle's hit area | adapted | the bar is the web's 40 by 6; its hit area is at least the theme's minimum target, so a touch finds it |
| Text scale 2.0, narrow, right to left; labelled 44 by 44 targets under touch | matched | `right to left at text scale 2.0 on a narrow screen: no overflow; labelled 44 by 44 targets under touch` |
| Contrast light and dark | matched | `text contrast, light and dark` |
| `renderTrigger={false}` | adapted | Flutter dialogs never render a trigger: the page's button calls `showInvisibleDialog`, and `returnFocus` names where focus goes when the dialog was opened by something else; held by `test/sidebar_drawer_test.dart` (`returnFocus names where focus goes when focus was elsewhere at the opening`) |
| The system areas | adapted | a bottom sheet stays above the keyboard; the panel reaches the screen edge it is anchored to |
| `--ds-sheet-dialog-duration`, `--ds-sheet-dialog-handle` | out of scope | 250 ms and the border role, as the web defaults |
| Screen reader output on VoiceOver, TalkBack, NVDA | not yet verified | Assistive technology: not tested |

## Background token

The background reads the component token `--ds-dialog-background` on the web and `InvisibleColors.dialogBackground` in Flutter, both generated from `packages/tokens/tokens.json`; `tokens-parity.test.ts` and the Dart token tests hold the values.
