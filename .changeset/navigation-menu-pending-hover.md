---
"@design-system/svelte": patch
"@design-system/elements": patch
---

A navigation menu panel closed by a click no longer opens again on its own. A
pointer click also hovers the trigger, which starts the open delay; the delay
still pending now stops when the panel closes, as in the Vue adapter.
