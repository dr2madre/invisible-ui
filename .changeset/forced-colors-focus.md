---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

Focus stays visible in forced colors (Windows High Contrast). The theme
draws its focus ring with a shadow, which that mode drops, so the ring
simply vanished. `tokens.css` now forces a real outline in the
platform's `Highlight` colour on anything focused, drawn inside the
control so a scrolling container cannot clip it, and the controls whose
focus lives on a visually hidden input (checkbox, radio, switch,
segmented control, rating, toggle button, upload area) carry the same
outline on their visible part.
