---
"@design-system/core": minor
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

The avatar initials move to the core as `avatar.initialsOf`, with shared
test vectors in `core/src/avatar/__vectors__` that the Flutter adapter reads
too. The `initialsOf` each adapter exports keeps its name and result and now
calls the core one, in place of four copies of the same logic.
