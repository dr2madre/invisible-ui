---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

The design source moves to `packages/tokens/tokens.json` and now holds the
colour roles for the light and dark themes, the focus ring sizes, the type
scale and a density tier (compact, regular, touch) with the minimum target
size. 69 stylesheet tokens are now design owned in the token registry. No
`--ds-*` value changes: `tokens.css` is the same file, and the parity test
checks every value in the source against it.
