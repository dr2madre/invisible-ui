# Calendar parity checklist

Reference commit: `7a4d645e2f259cd7503a8d4a6aca9143e9871ded`

Reference paths: `core/src/calendar` `packages/svelte/src/lib/calendar`

The Flutter `Calendar` checked against the headless calendar in
`core/src/calendar`, the
[WAI-ARIA date picker dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/)
grid, and the Svelte `Calendar`
(`packages/svelte/src/lib/calendar/Calendar.svelte`), with the accessibility
fixes the custom elements and React adapters carry: every day of a range is
selected, its ends are named "range start" and "range end", and the band is
closed by lines so the range never relies on colour alone.
Docs page: [Calendar](https://dr2madre.github.io/invisible-ui/components/forms/calendar/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/calendar_test.dart`
that holds it. The grid, the keys, the bounds and the range rules also answer
the shared vectors in `core/src/calendar/__vectors__/calendar.json`, and the
names those in `calendar-names.json` (`test/calendar_vectors_test.dart`).

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Calendar(value:, onChanged:)` | `value` with `onValueChange` | controlled `value`, change callback |
| `Calendar.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `Calendar.range(range:, onRangeChanged:)` | `mode="range"`, `rangeStart`, `rangeEnd`, `onRangeChange` | the range as one `DateRange`, its `end` null while half made |
| `Calendar.rangeUncontrolled(initialRange:)` | `mode="range"`, unbound | the range's default |
| `focusedDate`, `onFocusChanged` | `focusedDate`, `onFocusChange` | the focused day, reflected and reported |
| `view: CalendarView.month` or `.twoMonth` | `view` (`month`, `two-month`) | adapted: the two date-picking views; see below |
| `weekStartsOn: DateTime.monday` … `DateTime.sunday` | `weekStartsOn` 0 (Sunday) to 6 | the same day, in Dart's weekday constants |
| `min`, `max` | `min`, `max` | inclusive bounds |
| `locale`, `symbols` | `locale` | the locale of the names; `symbols` overrides them |
| `label` | `label` | the grid's name, catalog key `calendar.label` |
| `showToday` | `showToday` | the Today button |
| values are `DateTime` calendar days | ISO `YYYY-MM-DD` strings | adapted: idiomatic Dart; the time of day is ignored and local midnight is reported |
| messages `calendarPrevious`, `calendarNext`, `calendarToday` | `prevLabel`, `nextLabel`, `todayLabel` | adapted: through `InvisibleThemeData.messages`, as every Flutter widget |

## Views and content

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Month view: six weeks, padded with the neighbouring months | matched | `shows the value's month; a tap picks, reports local midnight once; the same day reports nothing`; `monthMatrix` answers the shared vectors |
| Two-month view: each day once, in its own month, side by side when there is room, stacked otherwise | matched | `two months sit side by side when wide and stack when narrow; each day shows once` |
| Week, three-day, day and year views; the view switcher | out of scope | agenda views for events; no Flutter consumer needs them yet |
| Event dots, prices, `renderDay`, `maxDots`, `yearColumns` | out of scope | the same agenda use |
| Period title as a live region | matched | the title is a header and a live region; two months read "June 2026 – July 2026" (adapted: no `formatRange`, two month titles joined) |

## Pointer

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A tap picks a day and reports once; the picked day again reports nothing | matched | `shows the value's month; a tap picks, reports local midnight once; the same day reports nothing` |
| Days outside `[min, max]` are disabled and ignore taps | matched | `min and max disable the days outside; a tap there does nothing` |
| Previous, next and Today move the focused day, and focus with it | matched | `the previous, next and Today buttons move focus` |
| Range: a pick starts, the next ends, a pick before the start becomes the start | matched | `a pick starts, the next ends, one before the start moves it; every day is selected and the ends say so`; `extendRange` answers the shared vectors |

## Keyboard

| Line | Status | Evidence or reason |
| --- | --- | --- |
| One tab stop: the focused day | matched | `one tab stop: the picked day; the arrows, Home, End, Page Up and Page Down move focus; Enter picks` |
| Arrows by day and week; Home and End to the week's edges; Page Up and Page Down by month, with Shift by year; Enter and Space pick | matched | same test, and the keyboard vectors |
| Right to left: Left is the next day | matched | `right to left: the left arrow is the next day` |
| Focus stays inside `[min, max]` | matched | `focus stays within min and max` |
| The grid follows focus into another month | matched | `one tab stop: …` (Page Down shows July) |
| Focus ring on keyboard focus | matched | `keyboard focus shows the ring on the day` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="grid"` named by `label`, `gridcell`, `columnheader` | adapted | Flutter has no grid role (`SemanticsRole.table` checks for table children a date grid is not); the month is a container named by the label, each day a button, and the column headers stay out of the tree since each day's name carries its weekday: `each day is a button named by its full date; today says so; the grid is named; targets and contrast` |
| Day named by its full date in the locale | matched | same test, and `names follow the locale and never the time zone` |
| Picked day `aria-selected` | matched | `a controlled value is shown without a report` |
| Range days all selected; ends named "range start" and "range end" | matched | `a pick starts, the next ends, one before the start moves it; every day is selected and the ends say so` |
| `aria-current="date"` on today | adapted | Flutter semantics have no current-date property; today's name ends with the catalog's `calendar.current` ("today"), added to the core catalog for this |
| `aria-disabled` outside the bounds | matched | `min and max disable the days outside; a tap there does nothing` |
| Labeled targets and contrast | matched | `each day is a button named by its full date; …` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look, layout and locale

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Picked day filled; range ends filled; days between banded with lines above and below | matched | `a pick starts, …` checks the band's lines |
| Today bold in the primary colour; neighbouring days in secondary text | matched | the day's style; the contrast guideline holds |
| Weekday and month names from the locale, Gregorian | adapted | no `Intl` in Flutter's widgets layer: `DateSymbols` carries the CLDR names of 23 locales, checked against `Intl` by the core tests through the shared vectors; names come from the calendar day, so a time zone never shifts them: `names follow the locale and never the time zone` |
| Day numbers in the locale's digits | adapted | the web prints ASCII digits in the grid; Flutter uses the locale's, as its full names do |
| `weekStartsOn` | matched | `weekStartsOn sets the first column` |
| Right to left at text scale 2.0 in a narrow window; 24 by 24 days, 44 by 44 under touch | matched | `right to left at text scale 2.0 in a narrow window, with 24 by 24 days, and 44 by 44 under touch` |
