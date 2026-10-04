---
"@design-system/core": patch
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/elements": patch
---

The calendar shows the right weekday and month names in every time zone.
The names came from dates at UTC midnight, which fall on the previous day
west of UTC: in Los Angeles a week starting on Sunday showed Saturday first,
the two-month view showed May and June for June and July, and the year view
started with December. The core now builds the dates for the formatters at
local midnight (`localDate`, `weekdayDate`, `monthDate`), and the Svelte,
Vue and custom element calendars use them.
