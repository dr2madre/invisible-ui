---
"@nozcadesign/invisible-ui-core": minor
"@nozcadesign/invisible-ui-svelte": patch
"@nozcadesign/invisible-ui-vue": patch
"@nozcadesign/invisible-ui-react": patch
"@nozcadesign/invisible-ui-elements": patch
---

The avatar initials move to the core as `avatar.initialsOf`, with shared
test vectors in `core/src/avatar/__vectors__` that the Flutter adapter reads
too. The `initialsOf` each adapter exports keeps its name and result and now
calls the core one, in place of four copies of the same logic.
