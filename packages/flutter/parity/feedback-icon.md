# FeedbackIcon parity checklist

Reference commit: `e32e67cd2cc2fb993c9758007c27026cafc20420`

Reference paths: `packages/svelte/src/lib/feedback-icon`

The Flutter `FeedbackIcon` checked against the Svelte `FeedbackIcon`
(`packages/svelte/src/lib/feedback-icon/FeedbackIcon.svelte`). The
notifications and the feedback states used it before it was public.
Docs page: [Feedback Icon](https://dr2madre.github.io/invisible-ui/components/feedback/feedback-icon/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/feedback_icon_test.dart` that holds it.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `status: NotificationStatus.info` … | `status: "info"` … | the kind of feedback; info by default |
| `box: FeedbackIconBox.tint`, `transparent`, `solid` | `box: "tint"`, `"transparent"`, `"solid"` | what shows behind the glyph |
| `shape: FeedbackIconShape.rounded`, `round` | `shape: "rounded"`, `"round"` | the outline |
| `icon` | `children` | a glyph in place of the status one |
| `semanticLabel` | `label` | the name that makes it an image |
| `size` | `--ds-feedback-icon-size` | the side, 32 by default |

## Behaviour and semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| One glyph per status (circled i, tick, triangle, octagon, bulb) | matched | `each status has its own glyph and colour` |
| Decorative by default; with `label`, an image with that name | matched | `decorative unless named; a custom glyph replaces the status one; the box grows with text scale 2.0` |
| A custom glyph replaces the status one | matched | same test |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Tint: the status colour at 15 % behind the glyph in the status colour | matched | `each status has …` |
| Transparent: no chip, the same glyph size | matched | `a transparent box drops the chip; a solid one fills it and turns the glyph to the colour on it; round is a circle` |
| Solid: the status colour behind a glyph in the colour on it | matched | same test |
| Rounded with the control radius, or a circle | matched | same test |
| 2 rem box, 0.375 rem padding, growing with the text | matched | `decorative unless named; …` at text scale 2.0 |
| Targets | out of scope | not interactive |
