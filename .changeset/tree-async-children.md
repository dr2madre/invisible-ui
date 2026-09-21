---
"@design-system/core": minor
"@design-system/elements": minor
"@design-system/svelte": minor
"@design-system/vue": minor
"@design-system/react": patch
---

Add controlled asynchronous child loading to Tree View. Unloaded parents can
request children without giving the design system network access; loading,
failure, retry, concurrent requests and response ordering are explicit parts of
the public contract.
