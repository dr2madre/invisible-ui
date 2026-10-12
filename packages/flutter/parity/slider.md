# Slider parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `core/src/slider` `packages/svelte/src/lib/slider`

The Flutter `Slider` checked against the Svelte `Slider`
(`packages/svelte/src/lib/slider/Slider.svelte`) and the headless slider in
`core/src/slider`, which follow the
[WAI-ARIA slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/)
on a native `<input type="range">`. The browser owns that input's keys and
dragging, so the Flutter keyboard map follows the native range input.
Docs page: [Slider](https://dr2madre.github.io/invisible-ui/components/forms/slider/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/slider_test.dart`
that holds it. The snap, the percentage and the track fraction answer the
shared vectors in `core/src/slider/__vectors__`, read by
`test/value_vectors_test.dart` and by the core tests.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Slider(value:, onChanged:)` | `value` with `onValueChange` | controlled `value`, change callback |
| `Slider.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `onChangeEnd` | none | the end of a gesture, as the native `change` event; Flutter's own slider name |
| `enabled: false` | `disabled` | `disabled` |
| `label` | `label` | the accessible name, not shown |
| `min`, `max`, `step`, `orientation`, `showValue`, `showRange`, `ticks`, `format`, `icon` | the same names | as on the web |
| `locale` | none | the digits of the default value text |
| `onSaved` | none | the form saver every Flutter value control carries |
| `name` | `name` | out of scope: Flutter forms submit no strings |

The name collides with Material's `Slider`: an app importing both hides one
or imports this package with a prefix.

## Value and callbacks (ADR 0011)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Arrows move one step; Page Up and Page Down a tenth of the range, at least one step; Home and End to the ends | matched | `arrows, Page Up and Down, Home and End move the value and report each move once, with onChangeEnd per key`: the native range input's keys |
| Right to left, the horizontal arrows and the track mirror | matched | `right to left: the left arrow increases and the minimum sits at the right` |
| Every value lands on the step grid from `min` | matched | the shared snap vectors |
| A press on the track jumps there and drags | matched | `a drag reports each value and onChangeEnd once; a tap on the track jumps there` |
| `onChangeEnd` once per gesture, only when the value moved | adapted | the web adapters expose no end-of-gesture callback; Flutter apps expect one: same test |
| A vertical slider fills upward; up increases | matched | `vertical: up increases, a drag upward increases` |
| Reflection never reports; a changed value is shown snapped; the callback is read at call time | matched | `controlled: a changed value is shown snapped, never reported; the callback is read at the key` |
| A value that is not a number is ignored | matched | `a value that is not a number keeps the one shown` |
| New bounds or step snap the value silently | matched | `new bounds snap the value silently` |
| Disabled: no focus, no input, dimmed | matched | `disabled: no focus, no drag, no key, dimmed` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="slider"` named by `label`, with its value | matched | `semantics: a slider named by its label, with the value and the next values as text; increase and decrease step`: Flutter's slider flag, with the value, the increased and the decreased value as text |
| Assistive technology increments and decrements by a step | matched | same test, the increase and decrease actions |
| The value is read as a number | adapted | Flutter semantics carry text, so the value is `format`'s text, or the number in the locale's digits: `the value text follows the locale digits without format` |
| `aria-orientation` | adapted | Flutter semantics have no orientation; the keys work in both |
| The shown value, the range and the ticks are hidden from assistive technology | matched | the value is the slider's own; they are excluded from semantics |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look, motion and focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Track 0.375rem in the border colour, fill in the secondary colour, 1rem thumb with a 2px secondary rim | matched | `SliderTrack` and the thumb in `slider.dart` |
| Ticks at each step, only up to 20 | matched | `touch: the hit area is 44 tall; ticks, range and value show in a narrow column at text scale 2.0` |
| Ticks sit at a share of the input's width | adapted | the native thumb travels inset half a thumb, so web ticks drift from the thumb near the ends; Flutter places them on the thumb centres |
| Focus ring around the thumb on keyboard focus | matched | `the focus ring shows around the thumb on keyboard focus` |
| Forced colours borders | adapted | Flutter has no forced colours mode; under high contrast the focus ring is drawn alone, as for every control |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default, reports nothing | matched | `a form reset restores the default without a report; save reads the value` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| 14rem wide by default, or the parent's width | matched | `OpenWidth`, 224 |
| The hit area is at least the minimum target, 44 under touch | matched | `touch: the hit area is 44 tall; ticks, range and value show in a narrow column at text scale 2.0` |
