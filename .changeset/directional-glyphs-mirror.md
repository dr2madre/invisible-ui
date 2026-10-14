---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

Directional glyphs mirror in right-to-left text through the sheets, not
through each component: the tree twistie, the accordion chevron, the carousel
and calendar arrows, the sidebar group chevron and rail toggle, and the submenu
chevrons (which no longer depend on a `dir` attribute on the popup). The open
accordion and sidebar chevrons still point down. React and Elements Calendar no
longer swap their arrow glyphs in script.
