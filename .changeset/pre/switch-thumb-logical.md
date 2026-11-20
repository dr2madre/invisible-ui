---
"@nozcadesign/invisible-ui-svelte": patch
"@nozcadesign/invisible-ui-vue": patch
"@nozcadesign/invisible-ui-react": patch
"@nozcadesign/invisible-ui-elements": patch
---

The Switch thumb moves along the inline axis instead of by a physical
translate, so in right-to-left text it stays on the track and sits at the end
edge, the left one, when on.
