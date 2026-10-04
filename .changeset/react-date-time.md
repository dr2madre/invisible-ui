---
"@design-system/react": minor
"@design-system/elements": patch
"@design-system/svelte": patch
"@design-system/vue": patch
---

The React adapter now ships the date and time family: `Calendar`,
`DatePicker`, `DateRangePicker` and `TimeField`, with the markup, classes and
behaviour of the other adapters. The calendar renders the month, two-month,
week, three-day, day and year views, events and prices, single and range
selection, and the WAI-ARIA date grid keys; in right-to-left text ArrowLeft
and ArrowRight follow the visual direction. In a range every day is a selected
cell and the endpoints say so in their names. The pickers open the calendar in
a dialog popup with focus on the focused day, and render it inside the dialog
they sit in. TimeField follows the provider locale's hour cycle, reports a
structural error only when an edit changes it, and is disabled inside a
disabled fieldset.

Each value works controlled and uncontrolled (ADR 0011). The pickers and
TimeField submit with their form, and a form reset puts them back to the
current default without reporting (ADR 0012). Labels come from the catalog.
All four render on the server and hydrate without mismatches.

Two hooks render the same behaviour in markup of your own: `useCalendar` and
`useTimeField`. `usePopover` takes an `initialFocus` selector, like the dialogs, and a trigger of
any element type.

`styles.css` now includes the calendar, date picker, date range picker and
time field sheets. They are the same files the Vue and custom element
packages ship, now held byte for byte to the React copies.
