# Popover parity checklist

Reference commit: `0c336bd6e53053c3c9e46ad4d7701879eba50315`

Reference paths: `core/src/popover` `packages/svelte/src/lib/popover` `packages/svelte/src/lib/hover-card`

The Flutter `Popover` checked against the Svelte `Popover`
(`packages/svelte/src/lib/popover/Popover.svelte`, `create-popover.ts`, and
`hover-card/create-hover-card.ts` for the hover contract) and the headless
popover in `core/src/popover`: a non-modal panel whose trigger opens a
dialog.
Docs page: [Popover](https://dr2madre.github.io/invisible-ui/components/data-layout/popover/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/popover_test.dart`
that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Popover(...)` | `trigger="click"` | the intentional popover |
| `Popover.hover(...)` | `trigger="hover"` | the preview |
| `trigger` | `triggerContent` | the button's content, or the hover trigger itself |
| `triggerVariant`, `triggerIcon` | `triggerVariant` | the trigger `Button` |
| `builder: (context, controller)` | `children` | the panel content; the controller closes it |
| `label` | `label` | the panel's name; required, since Flutter cannot read a name from a widget trigger |
| `placement: PopoverPlacement.bottom` | `placement` | four sides; flips when there is no room |
| `openDelay`, `closeDelay` | the same names | hover delays, 300 and 200 ms |
| `controller` (`open`, `close`, `isOpen`) | bindable `open` | opening from code, never reported (ADR 0011 reflection); `controller` is how Flutter's own overlays take open state |
| `onOpenChanged` | `onOpenChange` | each user opening and closing, once |

## Click

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A press toggles; each change reported once | matched | `a press opens, focus moves to the first control, Escape closes and returns focus; each change is reported once` |
| Focus moves to the first focusable control, in reading order | matched | same test |
| Nothing focusable: the panel takes focus | matched | `a panel with nothing focusable takes focus itself`; the default trigger text is the catalog key `dialog.trigger` |
| Escape closes and returns focus to the trigger | matched | first test |
| A press outside closes; focus stays where the press put it | matched | `a press outside closes and leaves focus; a second press on the trigger closes` |
| Focus leaving the trigger and the panel closes, without pulling focus back | matched | `focus moving out of the trigger and the panel closes it` |
| Closing from code while focus is inside returns it to the trigger | adapted | the web loses focus to the page when the panel goes; Flutter returns it to the trigger so a keyboard user is not stranded: `a controller opens and closes without a report; closing from the content returns focus to the trigger` |
| A press on a popup opened from the panel (a Select's or Combobox's list) is inside the panel | adapted | on the web a native select's popup is outside the page and a portalled list counts as outside; Flutter draws every list in the overlay, so the popover counts it as its own: `a select in the panel: choosing an option keeps the popover open` |
| Inside a modal dialog, Escape closes the popover first (ADR 0016) | matched | `inside a dialog, Escape closes the popover and the dialog stays (ADR 0016)` |
| A tall panel scrolls | adapted | the web panel grows past the window; Flutter keeps it inside and scrolls: `a region picker fits a narrow window at text scale 2.0` |

## Hover

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The pointer resting opens after the delay; leaving closes after the delay; hoverable | matched | `the pointer resting opens after the delay; leaving closes after the delay; the panel itself keeps it open` |
| Keyboard focus opens after the delay; focus never moves in; Escape closes | matched | `keyboard focus opens after the delay, focus stays on the trigger, Escape closes` |
| Touch: the first tap shows the preview instead of the trigger's action | adapted | a tap with a finger or a pen toggles the preview; the trigger's own action still runs, since Flutter cannot cancel a child's tap: `a tap with a finger toggles it` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Trigger `aria-haspopup="dialog"`, `aria-expanded` | adapted | Flutter has no popup type; the trigger button carries the expanded state: `semantics: the trigger is an expandable button, the panel a dialog named by the label` |
| Panel `role="dialog"`, named | matched | same test (`SemanticsRole.dialog`) |
| Labeled targets and contrast | matched | same test |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Panel 20rem wide at most, surface radius, border, overlay shadow, padding 0.875rem by 1rem | matched | `_PopoverState._buildPanel` |
| Quiet focus style on the panel itself: tinted border and a thin ring inside | matched | `_FocusOutline` |
| Below by default, 6 px gap (8 px for hover), flips; start and end follow the reading direction | matched | `below by default; flips above near the bottom; start and end follow the reading direction` |
| Twelve Floating UI placements | adapted | four sides, aligned to the trigger's inline-start as the web's default placements; no consumer needs the aligned variants |
| Narrow window at text scale 2.0 | matched | `a region picker fits a narrow window at text scale 2.0` |
