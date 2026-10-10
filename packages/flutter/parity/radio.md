# Radio parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `packages/svelte/src/lib/radio`

The Flutter `Radio` checked against the Svelte `Radio`
(`packages/svelte/src/lib/radio/Radio.svelte`): one native radio button with
its label, grouped with the others of the same `name` by the browser, as in
the [WAI-ARIA radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).
Docs page: [Radio](https://dr2madre.github.io/invisible-ui/components/forms/radio/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/radio_test.dart`
that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Radio(value:, groupValue:, onChanged:)` | `value`, `checked`, `onChange` | checked when `value` equals the group's value; the callback reports this radio's value |
| `name` | `name` | the group: radios sharing it (in one focus scope) are mutually exclusive |
| `onChanged: null` | `disabled` | disabled, as Flutter's own radio |
| `label` | `label` or children | the visible label and the name |
| `autofocus` | none | focus when it first appears |

The name collides with Material's `Radio`: an app importing both hides one
or imports this package with a prefix. The widgets library's `RadioGroup`
arrived after the package's lower bound (Flutter 3.32), so the group is
found by `name` among the focus scope's nodes, as the browser finds radios
by `name` in a form.

## Value and callbacks (ADR 0011)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A tap or Space checks it and reports its value; checking the checked radio reports nothing | matched | `a tap and Space check a radio and report its value once` |
| One tab stop per group: the checked radio, or the first enabled one | matched | `one tab stop: the checked radio, or the first enabled one`; with none checked the browser also gives the last radio to Shift+Tab, Flutter keeps the first |
| Arrows move to the next or previous enabled radio, wrapping, and check it; right to left mirrors the horizontal arrows | matched | `arrows move and check, wrapping and skipping disabled radios; mirrored right to left` |
| Radios of another name form another group | matched | `radios with another name form another group` |
| Controlled and uncontrolled `checked` | adapted | the group's value lives with the parent, as `groupValue`; an uncontrolled group is `RadioButtonGroup.uncontrolled` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="radio"` named by its label, checked or not, disabled | matched | `semantics: checked in a mutually exclusive group, named by its label; 24 and 44 targets`: checked in a mutually exclusive group |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look, motion and focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| 1.1rem circle with the control border; a dot in the selection text colour when checked | matched | `RadioDot`, shared with `RadioButtonGroup` |
| Focus ring around the circle; disabled dimmed | matched | `ToggleTile`, shared with the other choice controls |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the checked default | out of scope | the radio holds no value of its own: the parent's `groupValue` is the state, and `RadioButtonGroup` joins a `Form` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The row is the target, 44 by 44 under touch | matched | `semantics: checked in a mutually exclusive group, named by its label; 24 and 44 targets` |
| A long label wraps | matched | `a long label wraps in a narrow column at text scale 2.0` |
