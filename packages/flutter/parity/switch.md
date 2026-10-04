# Switch parity checklist

Reference commit: `e47db9b6717964787e0d689629f1beb73f18612d`

Reference paths: `core/src/switch` `packages/svelte/src/lib/switch`

The Flutter `Switch` checked against the Svelte `Switch`
(`packages/svelte/src/lib/switch/Switch.svelte`) and the headless switch in
`core/src/switch`, which follow the
[WAI-ARIA switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)
on a native checkbox with `role="switch"`.
Docs page: [Switch](https://dr2madre.github.io/invisible-ui/components/forms/switch/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/switch_test.dart`
that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Switch(value:, onChanged:)` | `checked` with `onCheckedChange` | controlled `checked`, change callback |
| `Switch.uncontrolled(initialValue:)` | `checked` unbound | `defaultChecked` |
| `enabled: false` | `disabled` | `disabled` |
| `onOff`, `onText`, `offText` | the same names | the labelled track; defaults from the catalog keys `switch.on` and `switch.off` |
| `label`, `hideLabel`, `required` | the same names | as on the web |
| `description`, `error`, `validator`, `onSaved` | none | the field parts every Flutter value control carries |
| `name`, `value` | the same names | out of scope: Flutter forms submit no strings |

The name collides with Material's `Switch`: an app importing both hides one
or imports this package with a prefix.

## Value and callbacks (ADR 0011)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A tap on the track or the label flips it, reported once | matched | `a tap on the track or the label flips it and reports once` |
| Space flips it, Enter does not | matched | `Space flips it; Enter does not` |
| Reflection never reports; the callback is read at call time | matched | `a changed value is shown and never reported; the callback is read at the press` |
| Disabled takes no change and no focus | matched | `disabled: no change, reported disabled, no focus` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="switch"` announcing on and off | matched | `semantics: one toggled node with name, description, error`: Flutter's `toggled` flag, the switch semantics |
| Named by the label; invalid with a message | matched | same test |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look, motion and focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Track 2.5rem by 1.5rem with a boundary in both states; white thumb with a rim | matched | `_Track` |
| On/off text in the wider track | matched | `onOff shows the state as text from the messages` |
| Thumb at the inline-end when on | adapted | the web slides the thumb with a physical `translate`, so in right-to-left text it leaves the track; Flutter aligns it to the inline-end: `right to left: on puts the thumb at the left` |
| Reduced motion: no transition | matched | `reduced motion moves the thumb at once` |
| Focus ring around the track on keyboard focus | matched | `the ring follows the track on keyboard focus; 44 by 44 under touch; text scale 2.0 grows the track` |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default, reports nothing | matched | `a form reset restores the default without a report` |
| A controlled reset restores the last value the parent set | matched | `a controlled reset restores the last value the parent set` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The row is the target, 44 by 44 under touch; the track grows with the text; a long label wraps | matched | `the ring follows the track on keyboard focus; 44 by 44 under touch; text scale 2.0 grows the track` |
