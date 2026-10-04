# Loading parity checklist

Reference commit: `0c336bd6e53053c3c9e46ad4d7701879eba50315`

Reference paths: `packages/svelte/src/lib/loading`

The Flutter `Loading` checked against the Svelte `Loading`
(`packages/svelte/src/lib/loading`).
Docs page: [Loading](https://dr2madre.github.io/invisible-ui/components/feedback/loading/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/loading_test.dart`
that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `variant: LoadingVariant.dots`, `.spinner`, `.bar`, `.typing`, `.morph` | `variant` | the indicator's shape |
| `value` (0 to 100, `null` indeterminate) | `value` | a determinate bar's completion |
| `label`, `showLabel`, `showValue`, `detail` | the same props | name and visible texts |
| `status` | `status` | a running description of the work |
| `decorative` | `decorative` | hidden from assistive technology |
| `delay: Duration` | `delay` in ms | the no-flash delay |
| `overlay`, `veil` | `overlay`, `veil` | a busy layer over content |

## Content and states

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Dots by default, three of them | matched | `a polite live region named by the catalog label, three dots` |
| Spinner arc, morph shape | matched | `a custom label; the spinner and morph shapes` |
| Indeterminate bar: a segment sliding start to end, mirrored right to left | matched | `the indeterminate segment starts at the inline-start, right to left too` |
| Determinate bar: a fill at `value` %, clamped to 0 to 100 | matched | `a determinate bar reports its value and is not live` |
| Visible label, percentage and detail | matched | `visible label, percentage and detail stay out of semantics` |
| Status text visible, under a determinate bar | matched | `a determinate bar reports its value and is not live` |
| The no-flash delay; its timer goes with the widget | matched | `the no-flash delay shows nothing until it passes, and goes with the widget` |
| Overlay with a veil blocks the pointer; without a veil it lets it through | matched | `an overlay with a veil blocks the content below; without one it lets it through` |
| Overlay fills the nearest positioned ancestor | adapted | Flutter has no positioned ancestor: the overlay expands to its parent, which the app places in a `Stack` (`Positioned.fill`) |
| The indicator follows the text colour (`currentColor`) | matched | the colour of the ambient `DefaultTextStyle`, the theme's text colour without one |
| Sizes in em of the text, growing with the text scale | matched | `grows with the text at text scale 2.0 in a narrow space` |
| `--ds-loading-*` custom properties | out of scope | sizes come from the reference's defaults; a theme extension for them is not asked for yet |

## Semantics and motion

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A polite status named by the label, read when it appears | matched | `a polite live region named by the catalog label, three dots` (`liveRegion`, ADR 0017 §3) |
| The catalog's `loading.label` as the default name | matched | `InvisibleMessages.loadingLabel`; `test/messages_test.dart` |
| A status message is announced in full on each change | matched | `a status message names the region and changes with it`: the message is the live region's label |
| A determinate bar is a progress bar with its value | adapted | Flutter 3.32 cannot give a node a minimum and maximum value, which the progress bar role needs; the bar is a named node whose value is the percentage, or `detail`, or `status`, and it is not a live region: `a determinate bar reports its value and is not live` |
| The visible texts are hidden from assistive technology | matched | `visible label, percentage and detail stay out of semantics` |
| `decorative` hides it | matched | `decorative hides it from assistive technology` |
| Still under reduced motion, still visible | matched | `still under reduced motion, visible`; and the dots pulse in turn otherwise: `the dots pulse in turn while motion is allowed` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |
