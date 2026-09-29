---
"@design-system/core": patch
"@design-system/react": patch
"@design-system/svelte": patch
"@design-system/vue": patch
---

The shared catalog gains `button.copied` ("Copied"), the confirmation shown
beside a button after it copied its value (ADR 0016). The Svelte, Vue and
React adapters re-export the catalog as `en`, so they carry the new key too;
their components are unchanged.
