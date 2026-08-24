---
"@design-system/svelte": patch
"@design-system/vue": patch
---

Two controls that were drawn only with a fill stay visible in forced
colors, where fills flatten away: a carousel dot gets a border and the
selected one is filled with the platform's highlight, and the slider's
track and thumb take borders as well, so the control does not disappear
into the page.
