---
"@design-system/svelte": patch
"@design-system/react": patch
"@design-system/vue": patch
"@design-system/elements": patch
---

The ghost button now takes the text colour of the design system, like every
other variant. It used to inherit its colour from wherever it was placed, so
inside a native `<dialog>` it turned pure black. The inline notification close
button keeps following its surface.
