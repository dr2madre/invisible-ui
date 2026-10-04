# Time Field parity checklist

Reference commit: `7a4d645e2f259cd7503a8d4a6aca9143e9871ded`

Reference paths: `core/src/time-field` `packages/svelte/src/lib/time-field` `docs/time-field.md`

The Flutter `TimeField` checked against the headless time field in
`core/src/time-field`, its contract in
[`docs/time-field.md`](../../../docs/time-field.md), the
[WAI-ARIA spinbutton pattern](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/)
per segment, and the Svelte `TimeField`
(`packages/svelte/src/lib/time-field/TimeField.svelte`).
Docs page: [Time Field](https://dr2madre.github.io/invisible-ui/components/forms/time-field/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/time_field_test.dart` that holds it. Parsing, the bounds and the key
sequences also answer the shared vectors in
`core/src/time-field/__vectors__/time-field.json`
(`test/time_field_vectors_test.dart`).

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `TimeField(value:, onChanged:)` | `value` with `onValueChange` | controlled `value` (`HH:mm` or `HH:mm:ss`, 24-hour), change callback |
| `TimeField.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `onChangeEnd` | `onValueCommit` | the value when editing ends: focus leaves the field, or Enter |
| `onValidationChanged(TimeFieldError?)` | `onValidationChange` | adapted: reported after a user edit changes the error, a range error included, so a form follows what the field shows |
| `hourCycle` (12 or 24), `withSeconds`, `min`, `max`, `label`, `error` | the same names | `hourCycle` defaults to the locale's; `label` to the catalog key `timeField.label` |
| `enabled: false` | `disabled` | `disabled` |
| `locale` | the provider's locale | the locale whose hour cycle applies |
| `invalid` | `invalid` | adapted: a non-empty `error` marks the field invalid, as on every Flutter field |
| `description`, `required`, `hideLabel`, `validator`, `onSaved` | none | the field parts every Flutter value control carries |
| `name` (hidden input) | `name` | adapted: Flutter forms read the value through `onSaved` |

## Value contract

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The value is the canonical 24-hour string, null while incomplete; the hour cycle changes the display only | matched | `12 hours from the locale: AM or PM is never assumed; P sets PM; a tap toggles` |
| Flexible parsing with normalization (`9:30` is `09:30`), atomic rejection, seconds precision | matched | the parse vectors |
| AM or PM is never assumed for new input; a valid value derives it | matched | `12 hours from the locale: …` and `a 24-hour locale has no period; a new cycle keeps the time` |
| A new hour cycle keeps the time | matched | `a 24-hour locale has no period; a new cycle keeps the time` |

## Keyboard and pointer

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Digits type; a complete segment moves on; an impossible digit is ignored, focus stays | matched | `digits type with auto-advance; an impossible digit is ignored; each change reports once`; the key sequence vectors |
| A lone 0 in a 12-hour hour waits for a second digit | matched | the key sequence vectors |
| Up and Down step with wrapping; Left and Right move between segments; Backspace and Delete clear | matched | `Up and Down step with wrapping; Left and Right move; Backspace clears and reports null` |
| A and P set the period; a tap on the period toggles it | matched | `12 hours from the locale: …` |
| Escape puts back the last finished value, consumed only when it undid something | matched | `Escape puts back the last finished value and is consumed only when it undid something` |
| Enter commits and is left to the form | matched | `onChangeEnd reports when focus leaves the field or on Enter, once per change` |
| Moving between segments is editing; focus leaving the field ends it | matched | same test |
| Soft keyboards (`beforeinput`) | adapted | segments are not text inputs in Flutter, so no soft keyboard opens; on touch a vertical drag on a segment steps it, and assistive technology steps it with the increase and decrease actions |
| Disabled: no focus, no edits, the value stays readable | matched | `disabled: no focus, no edits, the value stays readable` |

## Validation

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A malformed or wrong-precision value from outside shows its error and reports nothing; an edit clears it | matched | `a malformed value from outside shows its error without a report; an edit clears it and reports` |
| A time outside `min` and `max` is reported, never clamped, with the catalog's message | matched | `a time past max is reported, never clamped; the callback fires for the edit only`; the range vectors |
| The error marks the group invalid; the out-of-range segment is marked too | matched | `a malformed value from outside …` (group); the segment's validation result |
| An application `error` replaces the field's own message | matched | the field's message order, as on every Flutter field |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="group"` named by the label | adapted | a field node named by the label holding the segments as their own nodes: `a named group of segments, each with its value and step actions; targets and contrast` |
| Each segment `role="spinbutton"`, named, with its value and range | adapted | `SemanticsRole.spinButton` fails Flutter's debug role check; each segment is an adjustable node named by the catalog, with its value and the values of the increase and decrease actions: same test |
| An empty segment reads the catalog's `timeField.empty` | matched | `an empty segment reads as empty` |
| Separators are decorative | matched | excluded from semantics |
| Labeled targets and contrast | matched | `a named group of segments, …` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The segment being edited is highlighted on any focus, touch included | matched | the segment's fill while focused |
| Tabular figures; placeholders `hh`, `mm`, `ss`, `--` in secondary text | matched | the segment's style |
| Right to left | adapted | the segments read left to right in every direction, as times are written; Left and Right follow that order: `right to left at text scale 2.0 in a narrow column: the time still reads left to right; 44 by 44 segments under touch` |
| Text scale 2.0 in a narrow column; 44 by 44 segments under touch | matched | same test; the segments wrap rather than overflow |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default, reports nothing; a controlled value is shown without a report | matched | `a form reset restores the default silently; a controlled value is shown without a report` |
