---
"@invisible-ui/svelte": patch
"@invisible-ui/vue": patch
"@invisible-ui/react": patch
"@invisible-ui/elements": patch
---

In right-to-left text the Sidebar rail tooltip sits at the inline end, on the
left, and the Context Menu opens toward the inline end of the pointer, on the
left; from the keyboard it opens at the region's top right corner. A
`placement` given to the Svelte or Vue Context Menu still wins.
