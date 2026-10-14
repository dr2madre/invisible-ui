---
"@design-system/core": patch
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

Arrow keys follow the reading direction in Tabs, Pagination, Calendar,
Carousel and Menubar in Svelte and Vue, as they already did in React and
Elements. The core connections of those five read the computed direction of
the focused control on each key press when no `direction` is given, so a `dir`
set anywhere above counts, with or without a locale provider; React and
Elements Calendar use it instead of their own swap. In Svelte and Vue the
Menubar now routes its keys through the core menubar, and an arrow onto a
disabled menu moves DOM focus to that trigger together with the tab stop.
