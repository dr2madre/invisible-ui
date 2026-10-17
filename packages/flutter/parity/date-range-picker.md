# Date Range Picker parity checklist

Reference commit: `31edd44ea7637357a2eac288bcc050e07f52852f`

Reference paths: `core/src/calendar` `core/src/popover` `packages/svelte/src/lib/date-range-picker`

The Flutter `DateRangePicker` checked against the Svelte `DateRangePicker`
(`packages/svelte/src/lib/date-range-picker/DateRangePicker.svelte`). It shares
the field and popup of the Flutter `DatePicker` ([date-picker.md](date-picker.md)),
whose pointer, keyboard, semantics and layout lines hold for it too, and opens
a range `Calendar` ([calendar.md](calendar.md)).
Docs page: [Date Range Picker](https://dr2madre.github.io/invisible-ui/components/forms/date-range-picker/).

Each line is **matched**, **adapted** (with the platform reason), **open**
(with the gap) or **out of scope**. Every matched line names the widget test in
`test/date_picker_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `DateRangePicker(value:, onChanged:)` | `start`, `end` with `onChange` | adapted: one `DateRange` value, its `end` null while half made; null when cleared |
| `DateRangePicker.uncontrolled(initialValue:)` | `start`, `end` unbound | the defaults |
| `view` (`CalendarView.twoMonth` by default) | `view` (`two-month` by default) | the calendar's months |
| `min`, `max`, `weekStartsOn`, `locale`, `clearable`, `label`, `placeholder`, `enabled` | the same names, `disabled` | as on `DatePicker`; the catalog keys are `dateRangePicker.*` |
| `startName`, `endName` | `startName`, `endName` | adapted: Flutter forms read the value through `onSaved` |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The first pick starts the range and the popup stays; the second ends it, closes before reporting and returns focus | matched | `the first pick starts, the second ends and closes; the field shows both; each pick reports` |
| The field shows both dates, or the start and an ellipsis while half made | matched | same test (adapted: two medium dates joined by a dash, no `formatRange`) |
| Each pick and the clear report once | matched | same test |
| Enter, Space and Down open the popup with focus on the start day, else today | open | the shared field opens on these keys and the range calendar focuses its start, but no range picker test opens it from the keyboard or checks where focus lands |
| The range is made with the keyboard alone: Enter picks the start, the arrows move, Enter picks the end, the popup closes and focus returns to the field | open | the calendar's Enter picks through the same path as a tap, but no range picker test makes a range from the keyboard |
| The clear button keeps focus in the control | open | the shared field returns focus to the field after a key press on the button (see [date-picker.md](date-picker.md)), but no range picker test checks focus after a clear |
| The popup shows two months; the ends are named "range start" and "range end"; every day of the range is selected | matched | `semantics: the ends of the range are named in the popup` |
| Field named by the label with the range as its value | matched | same test |
| Labeled targets and contrast | matched | same test |
| Form reset restores the default range silently | matched | `a form reset restores the default range silently` |
| Popup at most 40rem wide, within the window | matched | the shared field, held by `right to left at text scale 2.0 in a narrow window, …` |
