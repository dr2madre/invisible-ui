---
"@invisible-ui/core": minor
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
"@invisible-ui/react": minor
"@invisible-ui/elements": minor
---

Tree View gains typeahead: a character, or a quick sequence of them, moves
focus to the next visible node whose label starts with it, never the
selection. Select, menu and tree share one matcher in core. The disclosure
arrow always expands and collapses its node, also after a failed load; Right
Arrow still retries. Svelte and Vue now mirror the arrow keys in
right-to-left text, as the spec and the other adapters do.
