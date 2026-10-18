---
"@invisible-ui/core": patch
"@invisible-ui/svelte": patch
"@invisible-ui/vue": patch
"@invisible-ui/react": patch
"@invisible-ui/elements": patch
---

Without a locale provider, a component now reads the page direction from
`<body dir>` as well as from the document element, and follows a runtime
change of either. Before, a page that set `dir="rtl"` on the body only got
popups forced to left to right.
