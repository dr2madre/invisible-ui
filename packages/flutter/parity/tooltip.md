# Tooltip parity checklist

Reference commit: `bde4433a71312b89d1164c6a1adce57471999a4a`

Reference paths: `core/src/tooltip` `packages/svelte/src/lib/tooltip`

The Flutter `Tooltip` checked against the Svelte `Tooltip`
(`packages/svelte/src/lib/tooltip/Tooltip.svelte` and `create-tooltip.ts`)
and the headless tooltip in `core/src/tooltip`, which follow the
[WAI-ARIA tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)
and WCAG 1.4.13 (content on hover or focus).
Docs page: [Tooltip](https://dr2madre.github.io/invisible-ui/components/data-layout/tooltip/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/tooltip_test.dart`
that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `message` | `text` | the supplementary text; `message` is the name Flutter's own tooltip uses |
| `child` | the children | the trigger |
| `placement: TooltipPlacement.top`, `.bottom`, `.start`, `.end` | `placement` (Floating UI placements) | preferred side, flipping when it has no room |
| `waitDuration` | `openDelay` | hover delay before showing (300 ms) |
| `exitDuration` | `closeDelay` | delay before hiding after the pointer leaves (100 ms) |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Hover shows after the open delay, leaving hides after the close delay | matched | `hover shows it after the wait and hides it after leaving` |
| Delays follow the props after mount | matched | `the delays follow the widget` |
| Keyboard focus shows at once; leaving focus hides | matched | `keyboard focus shows it at once; leaving focus hides it` |
| Escape hides at once, wherever focus is, even while hovered, and stays available to the rest of the page | matched | `Escape hides it, even while hovered` |
| Hoverable: stays while the pointer is over the tooltip | matched | `it stays while the pointer moves onto it` |
| Touch and pen: a tap toggles; the trigger still runs | matched | `a tap with a finger toggles it` |
| Focus never moves into the tooltip | matched | the bubble has no focusable content |
| `onOpenChange` (core context) | out of scope | the Svelte `Tooltip` component does not expose it |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="tooltip"` linked by `aria-describedby` | adapted | Flutter 3.32 has no checked tooltip role (`SemanticsRole.tooltip` fails the framework's debug role check there). The message is the trigger's `tooltip` semantics property, merged into the trigger's node, which screen readers read after its name: `the message is the trigger tooltip, never its name` |
| Never the accessible name | matched | same test: an icon-only button keeps its `semanticLabel` |
| The bubble is not read twice | matched | same test |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Placement and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Above the trigger by default, centred, 6 px gap | matched | `above the trigger by default` |
| Flips when the preferred side has no room | matched | `below the trigger when the top has no room` |
| Start and end follow the reading direction | matched | `end follows the reading direction` |
| Shifts inside the viewport with 8 px padding; maximum width 18rem; long text wraps | matched | `a long message wraps inside a narrow screen at text scale 2.0` |
| Twelve Floating UI placements (`top-start` and the others) | adapted | four sides, centred on the trigger; no consumer needs the aligned variants |
| Positioned in an overlay (portal) | matched | `OverlayPortal` with the shared anchored layout |

## Tokens and motion

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Background `emphasis-surface`, text `on-emphasis`, radius `radius.control`, overlay elevation | matched | `meets the text contrast guideline` (light and dark) |
| Padding 0.3rem 0.5rem, font size 0.8125rem | matched | the reference sets them in its stylesheet; same numbers |
| Elevation `--ds-elevation-overlay` | adapted | the role lives in `tokens.css` only; the Flutter values copy its numbers until it moves into `tokens.json` |
| Reduced motion | matched | the reference has no motion; neither does the Flutter tooltip |
