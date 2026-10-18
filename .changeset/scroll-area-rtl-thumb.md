---
"@invisible-ui/core": patch
"@invisible-ui/svelte": patch
"@invisible-ui/vue": patch
"@invisible-ui/react": patch
"@invisible-ui/elements": patch
---

The Scroll Area horizontal thumb follows a right-to-left viewport, whose
`scrollLeft` is zero or negative: it starts at the right, moves as the content
scrolls, and a drag moves the content the way the thumb goes.
`scrollArea.scrollByThumbDrag` takes the viewport's direction as a third
argument, `"ltr"` by default.
