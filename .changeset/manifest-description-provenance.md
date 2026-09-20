---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

Every prop row in the generated manifests says where its description came from: `source` for the code's own JSDoc, `curated` for a committed text that differs from the source, `mdx` for the docs table, `none` when there is none. The generator prints the counts. No prop, type, default or requirement changes; the curated texts stay as they are, and their drift from the source is visible instead of silent.
