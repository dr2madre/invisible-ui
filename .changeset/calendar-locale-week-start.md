---
"@invisible-ui/core": minor
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
"@invisible-ui/react": minor
"@invisible-ui/elements": patch
---

Calendar, Date Picker and Date Range Picker start the week on the locale's
first day by default, from `weekStart.weekStartsOn(locale)` in core (CLDR,
language and region), with the locale read from the i18n provider so server
and client agree. Svelte, Vue and React defaulted to Monday; Elements used
`Intl` and now uses the same core table. `weekStartsOn` still overrides it.
