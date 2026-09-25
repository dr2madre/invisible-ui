---
"@design-system/elements": patch
"@design-system/vue": patch
---

The popover card is never wider than the viewport less 1rem, so it fits a
320px screen instead of overflowing it by 8px. The inline notification close
button in Elements is sized as an icon-only button, as in Vue.
