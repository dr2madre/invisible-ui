# RadioButtonGroup parity checklist

Reference commit: `0c336bd6e53053c3c9e46ad4d7701879eba50315`

Reference paths: `core/src/radio-group` `core/src/internal/collection.ts` `packages/svelte/src/lib/radio-group`

The Flutter `RadioButtonGroup` checked against the Svelte `RadioGroup`
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
| `RadioButtonGroup` | `RadioGroup` | the widgets library has its own `RadioGroup` (a registry for raw radio buttons), so the Flutter widget has another name |
| `RadioButtonGroup(value:, onChanged:)` | `value` with `onValueChange` | controlled `value`, change callback |
| `RadioButtonGroup.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `items: [ChoiceItem(...)]` | `items: [{ value, label?, disabled? }]` | the options |
| `orientation: Axis.vertical` | `orientation="vertical"` | layout |
| `enabled: false` | `disabled` | `disabled` |
| `hideLabel`, `required`, `description`, `error`, `validator`, `onSaved` | none | the field parts every Flutter value control carries |
| `name` | `name` | out of scope: Flutter forms submit no strings |

## Value and keyboard

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A tap chooses, reported once; the chosen option again reports nothing | matched | `a tap chooses and reports once; the chosen one again reports nothing` |
| Arrows move focus and choose, skip disabled options, wrap | matched | `the arrows move and choose, skip a disabled option and wrap`; the step is `stepEnabled`, held to `core/src/internal/collection.ts` by the shared vectors in `core/src/select/__vectors__` |
| Every arrow works whatever the orientation, as native radios | matched | same test (Down, Right, Up, Left) |
| Right and left mirror in right-to-left text | matched | `right to left: the left arrow moves forward` |
| One tab stop: the chosen option, else the first enabled | matched | `one tab stop: the chosen option, else the first enabled` |
| Space chooses the focused option; a disabled group takes nothing | matched | `Space chooses the focused option; a disabled group takes nothing` |
| Reflection never reports | matched | `a changed value is shown, never reported; a controlled reset restores it` |
| Shift+Tab lands on the last option when none is chosen | adapted | browsers differ here; Flutter lands on the first enabled option either way |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="radiogroup"` named by the label | matched | `semantics: a named radio group of exclusive options`: `SemanticsRole.radioGroup` |
| Each option a radio: checked, mutually exclusive, disabled reported | matched | same test |
| `aria-orientation` | adapted | Flutter has no orientation property; every arrow works anyway |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default, reports nothing | matched | `a changed value is shown, never reported; a controlled reset restores it` and `an uncontrolled reset restores the default; the validator can require a choice` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Dot 1.1rem with a 0.6rem dot in the selection text colour | matched | `RadioDot` |
| Horizontal wraps; 44 by 44 under touch; text scale 2.0 | matched | `a horizontal group wraps at a narrow width at text scale 2.0; targets keep 44 by 44 under touch` |
