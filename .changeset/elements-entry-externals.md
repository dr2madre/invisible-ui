---
"@design-system/elements": patch
---

Build the package entry and `define.js` apart. The entry now leaves
`@design-system/core` and `@floating-ui/dom` to the consumer's bundler instead
of inlining them, so importing one element ships only the primitives it uses
(the Tag alone drops from 8.7 kB to under 1 kB, brotli). `define.js` is still
self-contained for script tags. Both dependencies were already declared, so no
install step changes.
