---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

The Switch thumb moves along the inline axis instead of by a physical
translate, so in right-to-left text it stays on the track and sits at the end
edge, the left one, when on.
