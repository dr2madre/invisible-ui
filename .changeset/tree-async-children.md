---
"@invisible-ui/core": minor
"@invisible-ui/elements": minor
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
"@invisible-ui/react": patch
---

Add controlled asynchronous child loading to Tree View. Unloaded parents can
request children without giving the design system network access; loading,
failure, retry, concurrent requests and response ordering are explicit parts of
the public contract.
