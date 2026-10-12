---
"@design-system/core": minor
"@design-system/svelte": minor
"@design-system/vue": minor
"@design-system/react": minor
"@design-system/elements": minor
---

Tree View gains typeahead: a character, or a quick sequence of them, moves
focus to the next visible node whose label starts with it, never the
selection. Select, menu and tree share one matcher in core. The disclosure
arrow always expands and collapses its node, also after a failed load; Right
Arrow still retries. Svelte and Vue now mirror the arrow keys in
right-to-left text, as the spec and the other adapters do.
