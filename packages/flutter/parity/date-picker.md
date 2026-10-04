# Date Picker parity checklist

Reference commit: `7a4d645e2f259cd7503a8d4a6aca9143e9871ded`

Reference paths: `core/src/calendar` `core/src/popover` `packages/svelte/src/lib/date-picker`

The Flutter `DatePicker` checked against the Svelte `DatePicker`
(`packages/svelte/src/lib/date-picker/DatePicker.svelte`), the field and popup
the React adapter shares between its pickers, and the
[WAI-ARIA date picker dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/).
It covers Timelog's needs: Gregorian values, a calendar popover, the week
start from the consumer, localized names, keyboard navigation, clearable.
The calendar inside is the Flutter `Calendar`
([calendar.md](calendar.md)); the popup is the Flutter `Popover`'s
([popover.md](popover.md)), opened by the field.
Docs page: [Date Picker](https://dr2madre.github.io/invisible-ui/components/forms/date-picker/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/date_picker_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `DatePicker(value:, onChanged:)` | `value` with `onValueChange` | controlled `value`, change callback; null when cleared |
| `DatePicker.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `DateTime` calendar day | ISO `YYYY-MM-DD` string | adapted: idiomatic Dart, as Flutter's own date pickers; the time of day is ignored and local midnight is reported |
| `min`, `max`, `weekStartsOn`, `locale`, `clearable`, `label`, `placeholder` | the same names | `weekStartsOn` in Dart's weekday constants; `label` and `placeholder` default to the catalog keys `datePicker.label` and `datePicker.placeholder` |
| `enabled: false` | `disabled` | `disabled` |
| `symbols` | none | the names, overriding the locale's |
| `description`, `error`, `required`, `hideLabel`, `validator`, `onSaved` | none | the field parts every Flutter value control carries |
| `dateStyle` | `dateStyle` | adapted: the field shows the locale's medium style, the web default; the other styles are not carried |
| `name` (hidden input) | `name` | adapted: Flutter forms read the value through `onSaved` |
| `events`, `prices` | `events`, `prices` | out of scope, as on the calendar |

## Pointer and keyboard

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A tap opens; focus moves to the calendar's focused day: the picked one, else today | matched | `a tap opens with focus on the picked day; a pick fills the field, closes, returns focus and reports once` |
| A pick fills the field, closes the popup before reporting, and returns focus to the field | matched | same test |
| Enter, Space and Down open; the date grid keys apply; Escape closes without a pick and returns focus | matched | `Enter, Space and Down open; the grid keys move; Enter picks; Escape closes without a pick and returns focus` |
| A press outside closes and leaves focus where it lands | matched | `a press outside closes and leaves focus where it lands` |
| The clear button, while a date is picked, empties the field, reports null, keeps focus in the control | matched | `the clear button empties the field, reports null and keeps focus in the control` |
| Disabled: no focus, no opening | matched | `disabled: no focus, no opening` |
| Inside a dialog, Escape closes the popup first | matched | the popover's rule, held by `inside a dialog, Escape closes the popover and the dialog stays (ADR 0016)` in `test/popover_test.dart` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Field `role="combobox"` with `aria-haspopup="dialog"`, `aria-expanded`, named by the label | adapted | `SemanticsRole.comboBox` fails Flutter's debug role check; the field is a button named by the label, with the date as its value and the expanded state: `semantics: the field is an expandable button with the date as its value; the popup is a dialog; targets and contrast` |
| Popup `role="dialog"` named by the label | matched | same test |
| Clear button named by the catalog key `datePicker.clear` | matched | `the clear button empties the field, reports null and keeps focus in the control` |
| Required, description, placeholder in the field's node | matched | `semantics: …` |
| Labeled targets and contrast | matched | `semantics: …` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look, layout and locale

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The field shows the date in the locale's medium style; the calendar names follow the locale; the week start follows the consumer | matched | `the locale names the field and the calendar` |
| The calendar glyph takes the selection colour once a date is picked | matched | the field's glyph |
| Popup at most 22rem wide, within the window | matched | `right to left at text scale 2.0 in a narrow window, the popup fits, under touch with 44 by 44 days` |
| Right to left at text scale 2.0 in a narrow window; 44 by 44 days under touch | matched | same test |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default, reports nothing; a controlled value becomes the default | matched | `a form reset restores the default silently; a controlled value becomes the default; the validator shows its message` |
