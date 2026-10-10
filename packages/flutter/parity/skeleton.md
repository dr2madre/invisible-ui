# Skeleton parity checklist

Reference commit: `e32e67cd2cc2fb993c9758007c27026cafc20420`

Reference paths: `packages/svelte/src/lib/skeleton`

The Flutter `Skeleton` checked against the Svelte `Skeleton`
(`packages/svelte/src/lib/skeleton/Skeleton.svelte`).
Docs page: [Skeleton](https://dr2madre.github.io/invisible-ui/components/feedback/skeleton/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/skeleton_test.dart`
that holds it.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `variant: SkeletonVariant.text`, `circle`, `rect` | `variant: "text"`, `"circle"`, `"rect"` | the shape |
| `lines` | `lines` | the number of text lines |
| `width`, `height`, `radius` (logical pixels) | `width`, `height`, `radius` (any CSS length) | the size; a percentage is the parent's job in Flutter (`FractionallySizedBox`) |
| `animation: SkeletonAnimation.pulse`, `wave`, `none` | `animation: "pulse"`, `"wave"`, `"none"` | the movement |
| `semanticLabel` | `label` | the name that makes it announced |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Pulse: 1 to 0.4 opacity and back over 1.5 s | matched | `the pulse moves; reduced motion and none hold it still` |
| Wave: a white band sweeps across over 1.6 s | matched | `the wave sweeps a band; lines follow text scale 2.0 in a narrow parent, right to left` |
| Still under reduced motion, and with `none` | matched | `the pulse moves; …` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Hidden from assistive technology | matched | `hidden from assistive technology; with a label, a live region named by it` |
| With `label`, a polite `role="status"` with `aria-busy` | adapted | Flutter has no status role or busy state; a live region named by the label: same test |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Text lines 0.8 em high, 0.5 rem apart, the last one at 60 % | matched | `text lines take the width, the last one shorter, each 0.8 of the text size high` |
| A circle 2.5 rem across, or `width` across | matched | `a circle is 40 across, or its width; a rectangle takes its height` |
| A rectangle as wide as its parent, `height` high | adapted | the web rectangle has no height until one is given; Flutter's is 40 high by default: same test |
| Neutral 200 in both modes, the control radius | matched | `the pulse moves; …` checks the still colour |
| An open width | adapted | the web bar takes its container's width; in a parent that leaves it open, such as a row, Flutter's takes 256 |
| Text scale 2.0, a narrow parent, right to left | matched | `the wave sweeps …` |
| Targets | out of scope | not interactive |
