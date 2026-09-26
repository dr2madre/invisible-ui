---
"@design-system/elements": minor
"@design-system/svelte": patch
"@design-system/vue": patch
---

Add `<ds-slider>`, `<ds-range-slider>` and `<ds-rating-group>`, ported from the Svelte adapter with the same classes, roles and stylesheets. They are built on native range inputs and native radios, so they submit with their form and come back to their default on a form reset. The range slider's value text and the rating's star names come from the locale catalog.
