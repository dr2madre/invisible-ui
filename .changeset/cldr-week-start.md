---
"@design-system/core": patch
---

`weekStart.forLocale(locale)` returns the first day of the week a
locale uses (1 = Monday … 7 = Sunday), from CLDR's week data and likely
regions, with no dependency on the runtime's `Intl` support. The table and its
test cases are shared with the Flutter adapter in
`core/src/calendar/__vectors__/week-start.json`. The adapters' calendar
defaults are unchanged.
