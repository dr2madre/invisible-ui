---
"@nozcadesign/invisible-ui-core": minor
"@nozcadesign/invisible-ui-svelte": minor
"@nozcadesign/invisible-ui-vue": minor
"@nozcadesign/invisible-ui-react": minor
"@nozcadesign/invisible-ui-elements": minor
---

Tree View gains typeahead: a character, or a quick sequence of them, moves
focus to the next visible node whose label starts with it, never the
selection. Select, menu and tree share one matcher in core. The disclosure
arrow always expands and collapses its node, also after a failed load; Right
Arrow still retries. Svelte and Vue now mirror the arrow keys in
right-to-left text, as the spec and the other adapters do.
