# Checkbox parity checklist

Reference commit: `0c336bd6e53053c3c9e46ad4d7701879eba50315`

Reference paths: `core/src/checkbox` `packages/svelte/src/lib/checkbox`

The Flutter `Checkbox` checked against the Svelte `Checkbox`
(`packages/svelte/src/lib/checkbox/Checkbox.svelte`) and the headless
checkbox in `core/src/checkbox`, which follow the
[WAI-ARIA checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/)
on a native `<input type="checkbox">`.
Docs page: [Checkbox](https://dr2madre.github.io/invisible-ui/components/forms/checkbox/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/checkbox_test.dart`
that holds it.

## Names

ADR 0017 decision 6: the Flutter API uses Flutter names.

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Checkbox(value:, onChanged:)` | `checked` with `onCheckedChange` | controlled `checked`, change callback |
| `Checkbox.uncontrolled(initialValue:)` | `checked` unbound | `defaultChecked`; two constructors keep the modes apart |
| `value: null` | `checked="indeterminate"` | the mixed state; `null` is how Flutter's own checkbox writes it |
| `onChanged` (a `bool`) | `onCheckedChange` | reported after the state moved; a user never produces the mixed state |
| `enabled: false` | `disabled` | `disabled` |
| `label`, `hideLabel`, `required` | the same names | as on the web |
| `description`, `error` | none | the field messages every Flutter value control carries, so a `validator` message has a place |
| `validator`, `onSaved`, `autovalidateMode` | native constraint validation | Flutter `Form` validation |
| `name`, `value` (the submitted string) | `name`, `value` | out of scope: Flutter forms submit no strings |
| `children` snippet | rich label | out of scope: the label is text, the accessible name |

The name collides with Material's `Checkbox`: an app importing both hides
one or imports this package with a prefix.

## Value and callbacks (ADR 0011)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A tap on the box or the label toggles | matched | `a tap on the box or the label toggles and reports once` |
| Space toggles, Enter does not | matched | `Space toggles; Enter does not, as on a native checkbox` |
| Mixed and unchecked check; checked unchecks (`nextChecked`) | matched | `mixed shows a bar and checks on activation` |
| Reflection never reports | matched | `a changed value is shown and never reported` |
| State first, then the report, once | matched | `the state moves before the report` |
| The callback is read at call time | matched | `the callback is read at the press` |
| Disabled takes no change and no focus | matched | `disabled: no focus, no change, reported disabled` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Checkbox role with checked state; `indeterminate` as mixed | matched | `one node: name, checked, mixed, description and error`: Flutter's `checked` and `mixed` flags |
| Named by the label, also when hidden | matched | `a hidden label still names it` |
| Required | matched | same test as the semantics line |
| Invalid with a message, glyph and live region | matched | same test; the message comes from `Field`'s frame |
| Labeled targets and contrast | matched | `meets the tap target and contrast guidelines` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Box 1.25rem, tick or bar in the selection text colour on a faint tint, border unchanged | matched | `CheckboxBox`; the glyph, not colour, carries the state |
| Focus ring on the box on keyboard focus only | matched | `the ring shows on keyboard focus only, around the box` |
| Disabled dims the box and the label | matched | `disabled: no focus, no change, reported disabled` |
| Forced colours outline | adapted | under high contrast the ring is drawn alone at the ring offset, the shared `FocusRingPainter` rule |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default, reports nothing | matched | `a reset restores the current default without a report` |
| A controlled reset restores the last value the parent set | matched | `a controlled reset restores the last value the parent set` |
| Validation and saving | matched | `the validator shows its message and saves the value` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The whole row is the target: 24 by 24, 44 by 44 under touch | matched | `the row keeps 44 by 44 under touch` |
| Right to left puts the box at the inline-start; a long label wraps at text scale 2.0; the box grows with the text | matched | `right to left puts the box at the right; text scale 2.0 wraps a long label at a narrow width` |
