---
"@nozcadesign/invisible-ui-core": minor
"@nozcadesign/invisible-ui-elements": minor
"@nozcadesign/invisible-ui-svelte": minor
"@nozcadesign/invisible-ui-vue": minor
"@nozcadesign/invisible-ui-react": patch
---

Add controlled asynchronous child loading to Tree View. Unloaded parents can
request children without giving the design system network access; loading,
failure, retry, concurrent requests and response ordering are explicit parts of
the public contract.
