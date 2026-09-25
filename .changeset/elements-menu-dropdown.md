---
"@design-system/elements": minor
"@design-system/svelte": patch
"@design-system/vue": patch
---

New `<ds-dropdown-menu>`, ported from the Vue adapter with identical classes: a
menu button whose `items` property takes actions, checkable items, separators
and named groups. Arrow keys, Home, End and typeahead move focus through the
items, Escape and an outside press close the menu and focus returns to the
trigger. A `select` event carries `detail.value` after the menu closes. The
menu tokens now ship in Elements as well as in Svelte and Vue.
