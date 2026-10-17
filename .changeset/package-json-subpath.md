---
"@invisible-ui/core": patch
"@invisible-ui/svelte": patch
"@invisible-ui/vue": patch
"@invisible-ui/react": patch
"@invisible-ui/elements": patch
---

Every package exposes `./package.json` through its export map: build tools
and component analyzers probe it, and the strict maps refused it. Additive
only.
