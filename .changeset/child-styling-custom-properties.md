---
"@invisible-ui/svelte": patch
"@invisible-ui/vue": patch
"@invisible-ui/elements": patch
"@invisible-ui/react": patch
---

Two new custom properties: `--ds-components-button-foreground-ghost-default` sets the text color of a
ghost button, and `--ds-toggle-border-width` sets the border width of a toggle
button. The inline notification and the segmented toggle group now style
their buttons and icons through these and the existing feedback icon
properties, instead of overriding the child's rules. They look the same as
before.
