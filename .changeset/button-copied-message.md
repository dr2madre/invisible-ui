---
"@invisible-ui/core": patch
"@invisible-ui/react": patch
"@invisible-ui/svelte": patch
"@invisible-ui/vue": patch
---

The shared catalog gains `button.copied` ("Copied"), the confirmation shown
beside a button after it copied its value (ADR 0016). The Svelte, Vue and
React adapters re-export the catalog as `en`, so they carry the new key too;
their components are unchanged.
