---
"@nozcadesign/invisible-ui-svelte": patch
"@nozcadesign/invisible-ui-react": patch
"@nozcadesign/invisible-ui-vue": patch
"@nozcadesign/invisible-ui-elements": patch
---

The ghost button now takes the text colour of the design system, like every
other variant. It used to inherit its colour from wherever it was placed, so
inside a native `<dialog>` it turned pure black. The inline notification close
button keeps following its surface.
