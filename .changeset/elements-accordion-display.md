---
"@design-system/elements": minor
"@design-system/svelte": patch
"@design-system/vue": patch
---

Add `<ds-accordion>` with `<ds-accordion-item>`, `<ds-collapsible>`, `<ds-aspect-ratio>`, `<ds-blockquote>`, `<ds-skeleton>` and `<ds-meter>`, ported from the Svelte adapter with the same classes, roles and stylesheets. Accordion items are written as markup, each one holding its panel content, or assigned through `items`. The Vue accordion sheet sets its root and items to `display: block`, so custom-element hosts lay out like the other adapters' elements.
