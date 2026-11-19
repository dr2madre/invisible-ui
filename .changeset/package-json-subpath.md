---
"@nozcadesign/invisible-ui-core": patch
"@nozcadesign/invisible-ui-svelte": patch
"@nozcadesign/invisible-ui-vue": patch
"@nozcadesign/invisible-ui-react": patch
"@nozcadesign/invisible-ui-elements": patch
---

Every package exposes `./package.json` through its export map: build tools
and component analyzers probe it, and the strict maps refused it. Additive
only.
