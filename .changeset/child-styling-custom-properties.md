---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/elements": patch
"@design-system/react": patch
---

Two new custom properties: `--ds-button-ghost-color` sets the text color of a
ghost button, and `--ds-toggle-border-width` sets the border width of a toggle
button. The inline notification and the segmented toggle group now style
their buttons and icons through these and the existing feedback icon
properties, instead of overriding the child's rules. They look the same as
before.
