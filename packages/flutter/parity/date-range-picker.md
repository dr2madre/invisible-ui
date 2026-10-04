# Date Range Picker parity checklist

Reference commit: `7a4d645e2f259cd7503a8d4a6aca9143e9871ded`

Reference paths: `core/src/calendar` `core/src/popover` `packages/svelte/src/lib/date-range-picker`

The Flutter `DateRangePicker` checked against the Svelte `DateRangePicker`
(`packages/svelte/src/lib/date-range-picker/DateRangePicker.svelte`). It shares
the field and popup of the Flutter `DatePicker` ([date-picker.md](date-picker.md)),
whose pointer, keyboard, semantics and layout lines hold for it too, and opens
a range `Calendar` ([calendar.md](calendar.md)).
Docs page: [Date Range Picker](https://dr2madre.github.io/invisible-ui/components/forms/date-range-picker/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
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
| The popup shows two months; the ends are named "range start" and "range end"; every day of the range is selected | matched | `semantics: the ends of the range are named in the popup` |
| Field named by the label with the range as its value | matched | same test |
| Labeled targets and contrast | matched | same test |
| Form reset restores the default range silently | matched | `a form reset restores the default range silently` |
| Popup at most 40rem wide, within the window | matched | the shared field, held by `right to left at text scale 2.0 in a narrow window, …` |
