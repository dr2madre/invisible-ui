---
"@design-system/core": patch
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

Every package exposes `./package.json` through its export map: build tools
and component analyzers probe it, and the strict maps refused it. Additive
only.
