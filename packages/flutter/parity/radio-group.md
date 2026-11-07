# RadioGroup parity checklist

Reference commit: `cd25a32fb29a63e2931ed22abfe8284b28513622`

Reference review (2026-10-19): checked the version-3 token hierarchy in the Svelte
reference. Behavior and accessibility markup did not change; CSS token names
changed, with resolved Light/Dark values checked by the token runtime tests.

Reference paths: `core/src/radio-group` `core/src/internal/collection.ts` `packages/svelte/src/lib/radio-group`

The Flutter `RadioGroup` checked against the Svelte `RadioGroup`
(`packages/svelte/src/lib/radio-group/RadioGroup.svelte`) and the headless
group in `core/src/radio-group`, which follow the
[WAI-ARIA radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
on native radio buttons sharing a name.
Docs page: [Radio Group](https://dr2madre.github.io/invisible-ui/components/forms/radio-group/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/radio_group_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `RadioGroup` | `RadioGroup` | the group; the widgets library's `RadioGroup`, which holds the value of raw radio buttons and which this widget is built on, keeps its name: apps tell them apart with the prefixed import (`iu.RadioGroup`) |
| `RadioGroup(value:, onChanged:)` | `value` with `onValueChange` | controlled `value`, change callback |
| `RadioGroup.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `items: [ChoiceItem(...)]` | `items: [{ value, label?, disabled? }]` | the options |
| `orientation: Axis.vertical` | `orientation="vertical"` | layout |
| `enabled: false` | `disabled` | `disabled` |
| `hideLabel`, `required`, `description`, `error`, `validator`, `onSaved`, `autovalidateMode` | none | the field parts every Flutter value control carries |
| `name` | `name` | out of scope: Flutter forms submit no strings |

## Value and keyboard

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A tap chooses, reported once; the chosen option again reports nothing | matched | `a tap chooses and reports once; the chosen one again reports nothing` |
| Arrows move focus and choose, skip disabled options, wrap | matched | `the arrows move and choose, skip a disabled option and wrap`: the native `RadioGroup` moves among its registered radios in reading order; a disabled option stays out of the registry, since the Flutter 3.35 group would otherwise move onto it (fixed in later releases) |
| Every arrow works whatever the orientation, as native radios | matched | same test (Down, Right, Up, Left) |
| Right and left mirror in right-to-left text | matched | `right to left: the left arrow moves forward`. The native group always moves to the next radio in reading order on the right arrow, which right to left lies on the left; `Radio` handles the horizontal arrows itself in right-to-left text, so each arrow moves the way it points, as in the reference and the browsers. Up and Down, and both arrows left to right, stay native |
| One tab stop: the chosen option, else the first enabled | matched | `one tab stop: the chosen option, else the first enabled`, the native group's traversal policy; a disabled chosen option leaves the stop to the first enabled one, in the same test |
| Space chooses the focused option; a disabled group takes nothing | matched | `Space chooses the focused option; a disabled group takes nothing`, the native group's Space. The group supplies the action its keys need, so they work without a `WidgetsApp` |
| Enter | adapted | in an app, Enter chooses the focused option, as Flutter's own `RawRadio` does; a browser radio ignores Enter or submits the form, and the radio group pattern defines no Enter key. `inside a RadioGroup: Enter checks the focused radio in an app, as the native radio does` in `test/radio_test.dart` |
| Reflection never reports | matched | `a changed value is shown, never reported; a controlled reset restores it` |
| Shift+Tab lands on the last option when none is chosen | adapted | browsers differ here; Flutter lands on the first enabled option either way |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="radiogroup"` named by the label | matched | `semantics: a named radio group of exclusive options`: the native `RadioGroup` node, `SemanticsRole.radioGroup`, carries the label, the description and the required state |
| The error is announced and marks the group invalid; a reset clears it | matched | `an uncontrolled reset restores the default; the validator can require a choice`: the error is the group's hint and `SemanticsValidationResult.invalid`, shown under the options with a hazard glyph as a live region, never colour alone |
| Each option a radio: checked, mutually exclusive, disabled reported | matched | same test; the options are `Radio` on `RawRadio`, which on iOS and macOS also reports the selected state |
| `aria-orientation` | adapted | Flutter has no orientation property; every arrow works anyway |
| Screen reader output on VoiceOver, TalkBack, NVDA | not yet verified | Assistive technology: not tested |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default, reports nothing | matched | `a changed value is shown, never reported; a controlled reset restores it` and `an uncontrolled reset restores the default; the validator can require a choice` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Dot 1.1rem with a 0.6rem dot in the selection text colour | matched | `RadioDot` |
| Focus ring around the focused option's circle after keyboard use | matched | `the focus ring shows around the focused option after keyboard use` |
| Horizontal wraps; 44 by 44 under touch; text scale 2.0 | matched | `a horizontal group wraps at a narrow width at text scale 2.0; targets keep 44 by 44 under touch`; the size is `InvisibleThemeData.minTargetSize` |
