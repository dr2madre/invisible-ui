---
"@design-system/svelte": patch
"@design-system/vue": patch
---

The notification region now follows the reduced motion setting when it
changes while the page is open. The Svelte region also reads the setting after
mount, so the server and the first client render match.
