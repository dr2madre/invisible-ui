---
"@invisible-ui/svelte": patch
"@invisible-ui/vue": patch
---

The CodeBlock scroller is a named group instead of a named landmark. It
stays focusable and announced, but several code blocks on one page no
longer fill the landmark list with identical entries.
