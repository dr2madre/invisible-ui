---
"@design-system/svelte": patch
---

The styled Pagination now honours the state and callback conventions the
other components follow (ADR 0011): a handler swapped after mount is the one
that fires, instead of the value captured at creation, and later `pageCount`,
`siblingCount`, `boundaryCount` and `disabled` props are reflected silently,
re-clamping the current page when the count shrinks. The headless
`createPagination` gains an additive `syncConfig` for the same reflection.
No markup or naming changes.
