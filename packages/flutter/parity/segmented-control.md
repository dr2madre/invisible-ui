# SegmentedControl parity checklist

Reference commit: `5df411f6ee7583b84e5a6d5cbd113ff147043f7d`

Reference review (2026-10-18): checked the token-model change in the Svelte
reference. Behavior and accessibility markup did not change; CSS token names
changed, with resolved Light/Dark values checked by the token runtime tests.

Reference review (2026-10-19): the outer border is the segmented control
border, which points at the shared action border, as the default Button border
does. Flutter reads the same token.

Reference paths: `core/src/radio-group` `packages/svelte/src/lib/segmented-control`

The Flutter `SegmentedControl` checked against the Svelte
`SegmentedControl` (`packages/svelte/src/lib/segmented-control/SegmentedControl.svelte`),
a radio group of native radio buttons styled as a bar.
Docs page: [Segmented Control](https://dr2madre.github.io/invisible-ui/components/forms/segmented-control/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/segmented_control_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `SegmentedControl(value:, onSelected:)` | `value` with `onValueChange` | controlled `value`, change callback; `onSelected` is the name ADR 0017 gives segmented choices |
| `SegmentedControl.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `items: [ChoiceItem(value:, label:, icon:)]` | `items: [{ value, label?, icon? }]` | the segments; the icon is a widget |
| `orientation`, `iconOnly`, `stacked`, `hideLabel` | the same names | layout |
| `enabled: false` | `disabled` | `disabled` |
| `description`, `error`, `validator`, `onSaved` | none | the field parts every Flutter value control carries |
| `name` | `name` | out of scope: Flutter forms submit no strings |

## Value and keyboard

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A tap chooses, reported once | matched | `a tap chooses, reports once through onSelected, and the choice is bold as well as tinted` |
| Arrows move and choose, wrapping, mirrored in right to left | matched | `arrows move and choose, wrapping, mirrored right to left` |
| One tab stop; Space chooses; reflection never reports | matched | `one tab stop; Space chooses; a changed value is not reported` |
| A disabled segment is skipped and takes no tap | matched | `a disabled segment is skipped and takes no tap` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="radiogroup"` named by the label; each segment a radio | matched | `semantics: a radio group; icon-only segments keep their name` |
| Icon-only segments named by their label (`aria-label`) | matched | same test |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The outer border in the segmented control border, the default Button border | matched | `the outer border is the segmented control border, in both themes` |
| The chosen segment tinted | matched | `a tap chooses, reports once through onSelected, and the choice is bold as well as tinted` |
| The chosen segment's label bold | adapted | the web shows the choice by colour only; Timelog's definition of done forbids that, so the label is bold too: same test |
| Focus ring inside the segment | matched | `_Segment`, an inside border as the web's inset ring |
| Stacked: icon above a smaller label | matched | `stacked puts the icon above the label` |
| A narrow bar scrolls sideways; a focused segment scrolls into view | matched | `a narrow bar scrolls sideways and a focused segment comes into view, at text scale 2.0` |
| Vertical: a column of segments | matched | `vertical stacks the segments; segments keep 44 by 44 under touch` |
| Targets 24 by 24, 44 by 44 under touch | matched | same test |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default, reports nothing | matched | `a form reset restores the default without a report` |
