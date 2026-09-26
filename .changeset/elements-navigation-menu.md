---
"@design-system/elements": minor
"@design-system/svelte": patch
"@design-system/vue": patch
---

New `<ds-navigation-menu>`, ported from the Vue adapter with identical classes:
a site navigation bar where some items reveal a panel of links, with hover
opening, immediate switching between open panels, Floating UI positioning,
dismissal on an outside press, ArrowDown into the panel and Escape back to its
trigger. The navigation menu tokens now ship in Elements as well as in Svelte
and Vue.
