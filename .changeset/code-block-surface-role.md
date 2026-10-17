---
"@design-system/svelte": minor
"@design-system/vue": minor
"@design-system/react": minor
"@design-system/elements": minor
---

Define `--ds-code-block-surface` in `tokens.css`, from the `code-block-surface`
role of each theme in the design source. Every code block sheet already reads
it for its background. The light theme takes `neutral-50`, `#f5f5f5`, in place
of `color-surface`; the dark theme takes `neutral-950`, `#1b1b1b`, the darkest
grey short of black, in place of `neutral-700`. The code block also drops the
line between its header and its code: spacing alone sets the header apart,
and the card keeps its outer border.
