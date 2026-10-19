# Radio parity checklist

Reference commit: `f2943333bf31794885e523ca48b6dd87f189d5af`

Reference review (2026-10-18): checked the token-model change in the Svelte
reference. Behavior and accessibility markup did not change; CSS token names
changed, with resolved Light/Dark values checked by the token runtime tests.

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
| `Radio(value:)` inside a `RadioGroup(groupValue:, onChanged:)` | `value`, `checked`, `onChange` | the widgets library's group holds the value and reports the choice, as for Flutter's own radios |
| `Radio(value:, groupValue:, onChanged:)` | `value`, `checked`, `onChange` | outside a `RadioGroup`: checked when `value` equals the group's value; the callback reports this radio's value |
| `name` | `name` | outside a `RadioGroup`, the group: radios sharing it (in one focus scope) are mutually exclusive |
| `enabled: false`, or `onChanged: null` outside a `RadioGroup` | `disabled` | disabled, as Flutter's own radio |
| `label` | `label` or children | the visible label and the name |
| `autofocus` | none | focus when it first appears |

The name matches Material's `Radio`: apps import this package with a prefix
(`iu.Radio`). The radio is built on the widgets library's `RawRadio`. Inside
a `RadioGroup` of the same type it registers with the group, as Flutter's own
radios do; outside one, it finds the radios of its `name` among the focus
scope's nodes, as the browser finds radios by `name` in a form.

## Value and callbacks (ADR 0011)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A tap or Space checks it and reports its value; checking the checked radio reports nothing | matched | `a tap and Space check a radio and report its value once`; in a `RadioGroup`, `inside a RadioGroup: a tap, Space and the arrows choose through the group, skipping disabled radios; right to left mirrors the horizontal arrows` |
| One tab stop per group: the checked radio, or the first enabled one | matched | `one tab stop: the checked radio, or the first enabled one`; in a `RadioGroup` the native group's traversal policy holds it: `inside a RadioGroup: one tab stop on the checked radio, or the first enabled one, also when the checked one is disabled`. With none checked the browser also gives the last radio to Shift+Tab, Flutter keeps the first |
| Arrows move to the next or previous enabled radio, wrapping, and check it | matched | `arrows move and check, wrapping and skipping disabled radios; mirrored right to left`; in a `RadioGroup` the native group moves on the arrows |
| Right to left mirrors the horizontal arrows | matched | the native `RadioGroup` always moves to the next radio in reading order on the right arrow, so right to left it moves left; the radio handles the horizontal arrows itself in right-to-left text, to keep the reference behaviour and the browsers' (the arrow moves the way it points). Up and Down, and both arrows left to right, stay native. Held by `inside a RadioGroup: a tap, Space and the arrows choose through the group, skipping disabled radios; right to left mirrors the horizontal arrows` |
| Disabled radios are skipped by the arrows and the tab stop | matched | the Flutter 3.35 `RadioGroup` moves onto disabled radios (fixed in later releases); a disabled radio stays out of the group's registry and still shows the group's value. Held by the same test and `a disabled radio still shows the checked state` |
| Enter | adapted | in an app, Enter checks the focused radio, as Flutter's own `RawRadio` does (the app's `ActivateIntent`); a browser radio ignores Enter or submits the form. The radio group pattern defines no Enter key. `inside a RadioGroup: Enter checks the focused radio in an app, as the native radio does` |
| Radios of another name form another group | matched | `radios with another name form another group` |
| Controlled and uncontrolled `checked` | adapted | the group's value lives with the parent, as a `RadioGroup` or `groupValue`; an uncontrolled group with a label is `iu.RadioGroup.uncontrolled` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="radio"` named by its label, checked or not, disabled | matched | `semantics: checked in a mutually exclusive group, named by its label; 24 and 44 targets` and `inside a RadioGroup: the group has the radio group role and each radio its checked state and name`: checked in a mutually exclusive group, from `RawRadio`, which on iOS and macOS also reports the selected state |
| `role="radiogroup"` around the radios | matched | in a `RadioGroup`, the native group's node: same test. Radios grouped by `name` have no group node, as in the browser |
| Screen reader output on VoiceOver, TalkBack, NVDA | not yet verified | Assistive technology: not tested |

## Look, motion and focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| 1.1rem circle with the control border; a dot in the selection text colour when checked | matched | `RadioDot`, shared with `iu.RadioGroup` |
| Focus ring around the circle after keyboard use; disabled dimmed | matched | `ToggleTileBody`, shared with the other choice controls; the ring follows `RawRadio`'s focused state. `the focus ring shows around the focused option after keyboard use` in `test/radio_group_test.dart` |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the checked default | out of scope | the radio holds no value of its own: the parent's group value is the state, and `iu.RadioGroup` joins a `Form` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The row is the target, 24 by 24, 44 by 44 under touch | matched | `semantics: checked in a mutually exclusive group, named by its label; 24 and 44 targets`; the size is `InvisibleThemeData.minTargetSize` |
| A long label wraps | matched | `a long label wraps in a narrow column at text scale 2.0` |
