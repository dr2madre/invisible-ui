---
"@design-system/svelte": minor
"@design-system/react": minor
"@design-system/vue": minor
"@design-system/elements": minor
---

`SearchField` can drop its submit button for a filter that applies as you
type: `submitButton={false}`, or `submit-button="false"` on `<ds-search-field>`. The search
glyph then sits at the start of the field as a decorative mark, and the clear
button stays. In Elements, the clear button no longer stays on screen while the
field is empty.
